package lynx

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
	"github.com/pocketbase/pocketbase/tools/security"

	"main/lynx/feeds"
	"main/lynx/singlefile"
	"main/lynx/summarizer"
	"main/lynx/url_parser"
)

var parseUrlHandlerFunc = url_parser.HandleParseURLRequest
var parseFeedHandlerFunc = feeds.SaveNewFeed
var convertFeedItemToLinkFunc = feeds.MaybeConvertFeedItemToLink

// Interfaces for dependency injection for summarization tests
type Summarizer interface {
	MaybeSummarizeLink(app core.App, linkID string)
}

var CurrentSummarizer Summarizer = &DefaultSummarizer{}

type DefaultSummarizer struct{}

func (s *DefaultSummarizer) MaybeSummarizeLink(app core.App, linkID string) {
	summarizer.MaybeSummarizeLink(app, linkID)
}

func InitializePocketbase(app core.App) {

	apiKeyAuth := ApiKeyAuthMiddleware(app)

	app.Cron().MustAdd("FetchFeeds", "0 */6 * * *", func() {
		feeds.FetchAllFeeds((app))
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.POST("/lynx/parse_link", func(e *core.RequestEvent) error {
			record, err := parseUrlHandlerFunc(app, e)
			if err != nil {
				return err
			}
			return e.JSON(http.StatusOK, map[string]interface{}{
				"id": record.Id,
			})
		}).Bind(apiKeyAuth, apis.RequireAuth())

		se.Router.POST("/lynx/generate_api_key", func(e *core.RequestEvent) error {
			return handleGenerateAPIKey(app, e)
		}).Bind(apis.RequireAuth())

		se.Router.POST("/lynx/parse_feed", func(e *core.RequestEvent) error {
			return parseFeedHandlerFunc(app, e)
		}).Bind(apiKeyAuth, apis.RequireAuth())

		se.Router.POST("/lynx/link/{id}/create_archive", func(e *core.RequestEvent) error {
			return handleArchiveLink(app, e)
		}).Bind(apis.RequireAuth())

		se.Router.GET(
			"/{path...}",
			apis.Static(os.DirFS("./pb_public"), true),
		)

		return se.Next()
	})

	// Automatically update last_viewed_at when links are loaded
	// individually. However, let the client control this behavior
	// with a header.
	app.OnRecordViewRequest("links").BindFunc(func(e *core.RecordRequestEvent) error {
		updateHeader := e.Request.Header.Get("X-Lynx-Update-Last-Viewed")
		if updateHeader != "true" {
			return e.Next()
		}

		e.Record.Set("last_viewed_at", time.Now().UTC().Format(time.RFC3339))

		err := app.Save(e.Record)
		if err != nil {
			log.Printf("Failed to update last_viewed_at: %v", err)
			return err
		}

		return e.Next()
	})

	app.OnRecordAfterCreateSuccess("links").BindFunc(func(e *core.RecordEvent) error {
		routine.FireAndForget(func() {
			CurrentSummarizer.MaybeSummarizeLink(app, e.Record.Id)
		})
		routine.FireAndForget(func() {
			singlefile.MaybeArchiveLink(app, e.Record.Id)
		})
		return e.Next()
	})

	app.OnRecordAfterCreateSuccess("feed_items").BindFunc(func(e *core.RecordEvent) error {
		routine.FireAndForget(func() {
			convertFeedItemToLinkFunc(app, e.Record.Id)
		})
		return e.Next()
	})
}

func handleGenerateAPIKey(app core.App, e *core.RequestEvent) error {
	authRecord := e.Auth
	if authRecord == nil {
		return apis.NewForbiddenError("Not authenticated", nil)
	}

	name := e.Request.FormValue("name")
	if name == "" {
		return apis.NewBadRequestError("'name' parameter is required", nil)
	}

	apiKey := security.RandomString(32)

	// Set expiration date to 6 months from now
	expiresAt := time.Now().UTC().AddDate(0, 6, 0)

	collection, err := app.FindCollectionByNameOrId("api_keys")
	if err != nil {
		return apis.NewBadRequestError("Failed to find api_keys collection", err)
	}

	record := core.NewRecord(collection)
	record.Set("user", authRecord.Id)
	record.Set("api_key", apiKey)
	record.Set("name", name)
	record.Set("expires_at", expiresAt.Format(time.RFC3339))

	if err := app.Save(record); err != nil {
		return apis.NewBadRequestError("Failed to save API key", err)
	}

	return e.JSON(http.StatusOK, map[string]interface{}{
		"name":       name,
		"api_key":    apiKey,
		"expires_at": expiresAt.Format(time.RFC3339),
		"id":         record.Id,
	})
}

func handleArchiveLink(app core.App, e *core.RequestEvent) error {
	linkID := e.Request.PathValue("id")
	if linkID == "" {
		return apis.NewNotFoundError("Link ID is required", nil)
	}

	authRecord := e.Auth
	if authRecord == nil {
		return apis.NewForbiddenError("Not authenticated", nil)
	}

	link, err := app.FindRecordById("links", linkID)
	if err != nil {
		return apis.NewNotFoundError("Link not found", err)
	}

	if link.GetString("user") != authRecord.Id {
		return apis.NewForbiddenError("You don't have permission to archive this link", nil)
	}

	go func() {
		singlefile.MaybeArchiveLink(app, linkID)
	}()

	return e.JSON(http.StatusOK, map[string]interface{}{
		"message": "Archive process started",
	})
}
