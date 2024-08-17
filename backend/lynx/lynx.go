package lynx

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/security"
)

var parseUrlHandlerFunc = handleParseURL

func InitializePocketbase(app core.App) {

	apiKeyAuth := ApiKeyAuthMiddleware(app)

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {

		e.Router.GET(
			"/*",
			apis.StaticDirectoryHandler(os.DirFS("./pb_public"), true),
		)

		e.Router.AddRoute(echo.Route{
			Method: http.MethodPost,
			Path:   "/lynx/parse_link",
			Handler: func(c echo.Context) error {
				return parseUrlHandlerFunc(app, c)
			},
			Middlewares: []echo.MiddlewareFunc{
				apis.ActivityLogger(app),
				apiKeyAuth,
				apis.RequireAdminOrRecordAuth(),
			},
		})

		e.Router.AddRoute(echo.Route{
			Method: http.MethodPost,
			Path:   "/lynx/generate_api_key",
			Handler: func(c echo.Context) error {
				return handleGenerateAPIKey(app, c)
			},
			Middlewares: []echo.MiddlewareFunc{
				apis.ActivityLogger(app),
				apis.RequireAdminOrRecordAuth(),
			},
		})

		return nil
	})

	// Automatically update last_viewed_at when links are loaded
	// individually. However, let the client control this behavior
	// with a header.
	app.OnRecordViewRequest("links").Add(func(e *core.RecordViewEvent) error {
		updateHeader := e.HttpContext.Request().Header.Get("X-Lynx-Update-Last-Viewed")
		if updateHeader != "true" {
			return nil
		}

		e.Record.Set("last_viewed_at", time.Now().UTC().Format(time.RFC3339))

		err := app.Dao().SaveRecord(e.Record)
		if err != nil {
			log.Printf("Failed to update last_viewed_at: %v", err)
			return err
		}

		return nil
	})
}

func handleGenerateAPIKey(app core.App, c echo.Context) error {
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return apis.NewForbiddenError("Not authenticated", nil)
	}

	name := c.FormValue("name")
	if name == "" {
		return apis.NewBadRequestError("'name' parameter is required", nil)
	}

	apiKey := security.RandomString(32)

	// Set expiration date to 6 months from now
	expiresAt := time.Now().UTC().AddDate(0, 6, 0)

	collection, err := app.Dao().FindCollectionByNameOrId("api_keys")
	if err != nil {
		return apis.NewBadRequestError("Failed to find api_keys collection", err)
	}

	record := models.NewRecord(collection)
	record.Set("user", authRecord.Id)
	record.Set("api_key", apiKey)
	record.Set("name", name)
	record.Set("expires_at", expiresAt.Format(time.RFC3339))

	if err := app.Dao().SaveRecord(record); err != nil {
		return apis.NewBadRequestError("Failed to save API key", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"name":       name,
		"api_key":    apiKey,
		"expires_at": expiresAt.Format(time.RFC3339),
		"id":         record.Id,
	})
}
