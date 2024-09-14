package url_parser

import (
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"

	"github.com/go-shiori/go-readability"
)

// Given a URL, load the URL (using relevant cookies for the authenticated
// user), extract the article content, and create a new Link record in pocketbase.
func HandleParseURLRequest(app core.App, c echo.Context) (*models.Record, error) {
	// Get the authenticated user
	authRecord, _ := c.Get(apis.ContextAuthRecordKey).(*models.Record)
	if authRecord == nil {
		return nil, apis.NewForbiddenError("Not authenticated", nil)
	}

	urlParam := c.FormValue("url")
	if urlParam == "" {
		return nil, apis.NewBadRequestError("Missing 'url' parameter", nil)
	}

	parsedURL, err := url.Parse(urlParam)
	if err != nil {
		return nil, apis.NewBadRequestError("Failed to parse URL", err)
	}

	feedItemID := c.FormValue("feed_item")
	var feedItem *models.Record
	if feedItemID != "" {
		feedItem, err = app.Dao().FindRecordById("feed_items", feedItemID)
		if err != nil {
			return nil, apis.NewBadRequestError("Failed to find feed item", err)
		}
		if feedItem.GetString("user") != authRecord.Id {
			return nil, apis.NewForbiddenError("Invalid feed item", nil)
		}
	}
	return HandleParseURLViaParams(app, authRecord.Id, parsedURL, feedItem)
}

func HandleParseURLViaParams(app core.App, userId string, url *url.URL, feedItem *models.Record) (*models.Record, error) {

	// Load user cookies
	cookieRecords, err := app.Dao().FindRecordsByFilter(
		"user_cookies",
		"user = {:user} && domain = {:url}",
		"-created",
		10,
		0,
		dbx.Params{"user": userId, "url": url.Hostname()},
	)
	if err != nil {
		return nil, apis.NewBadRequestError("Failed to fetch cookies", err)
	}

	// Prepare cookies for the request
	var cookies []*http.Cookie
	for _, record := range cookieRecords {
		cookies = append(cookies, &http.Cookie{
			Name:  record.GetString("name"),
			Value: record.GetString("value"),
		})
	}

	// Build request & add cookies
	client := &http.Client{}
	req, err := http.NewRequest("GET", url.String(), nil)
	if err != nil {
		return nil, apis.NewBadRequestError("Failed to create request", err)
	}
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}

	// Send
	resp, err := client.Do(req)
	if err != nil {
		return nil, apis.NewBadRequestError("Failed to send request", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		switch {
		case resp.StatusCode == 404:
			return nil, apis.NewNotFoundError("The requested URL was not found", nil)
		case resp.StatusCode >= 400 && resp.StatusCode < 500:
			return nil, apis.NewBadRequestError(fmt.Sprintf("Client error: %s", resp.Status), nil)
		case resp.StatusCode >= 500:
			return nil, apis.NewApiError(500, fmt.Sprintf("Server error: %s", resp.Status), nil)
		default:
			return nil, apis.NewApiError(resp.StatusCode, fmt.Sprintf("Unexpected status code: %s", resp.Status), nil)
		}
	}

	// resp.Body can only be read once, so store it locally here.
	bodyContent, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, apis.NewBadRequestError("Failed to read response body", err)
	}

	// Use go-readability to parse the webpage
	bodyReader := strings.NewReader(string(bodyContent))
	article, err := readability.FromReader(bodyReader, url)
	if err != nil {
		return nil, apis.NewBadRequestError("Failed to parse webpage content", err)
	}

	// Create a new record in the links collection
	collection, err := app.Dao().FindCollectionByNameOrId("links")
	if err != nil {
		return nil, apis.NewBadRequestError("Failed to find links collection", err)
	}

	record := models.NewRecord(collection)
	record.Set("added_to_library", time.Now().Format(time.RFC3339))
	record.Set("original_url", url.String())
	record.Set("cleaned_url", resp.Request.URL.String())
	record.Set("title", article.Title)
	record.Set("hostname", resp.Request.URL.Hostname())
	record.Set("user", userId)
	record.Set("excerpt", article.Excerpt)
	record.Set("author", article.Byline)
	record.Set("article_html", article.Content)
	record.Set("raw_text_content", article.TextContent)
	record.Set("header_image_url", article.Image)
	record.Set("full_page_html", string(bodyContent))
	record.Set("reading_progress", 0)
	if article.PublishedTime != nil {
		record.Set("article_date", article.PublishedTime)
	} else {
		record.Set("article_date", time.Now().UTC().Format(time.RFC3339))
	}
	if feedItem != nil {
		record.Set("created_from_feed", feedItem.GetString("feed"))
	}

	// Calculate read time, using 285 wpm as read rate
	words := strings.Fields(article.TextContent)
	wordCount := len(words)
	minutes := float64(wordCount) / float64(285)
	readTime := time.Duration(minutes * float64(time.Minute))
	record.Set("read_time_seconds", int(math.Round(readTime.Seconds())))
	record.Set("read_time_display", fmt.Sprintf("%d min", int(math.Round(readTime.Minutes()))))

	if err := app.Dao().SaveRecord(record); err != nil {
		return nil, apis.NewBadRequestError("Failed to save link", err)
	}

	if feedItem != nil {
		feedItem.Set("saved_as_link", record.Id)
		if err := app.Dao().SaveRecord(feedItem); err != nil {
			// Log the error but don't fail the request
			app.Logger().Error("Failed to update feed item", "error", err, "feed_item", feedItem.Id, "link", record.Id)
		}
	}

	return record, nil
}
