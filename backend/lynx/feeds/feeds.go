package feeds

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"main/lynx/url_parser"

	"github.com/mmcdole/gofeed"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

// FeedResult contains the parsed feed and the ETag and Last-Modified
// headers received from the remote server
type FeedResult struct {
	Feed         *gofeed.Feed
	ETag         string
	LastModified string
}

// LoadFeedFromURL fetches and parses a feed from the given URL.
// It optionally uses etag and ifModifiedSince for conditional requests.
func LoadFeedFromURL(url string, etag string, ifModifiedSince time.Time) (*FeedResult, error) {
	fp := gofeed.NewParser()

	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	if etag != "" {
		req.Header.Set("If-None-Match", etag)
	}
	if !ifModifiedSince.IsZero() {
		req.Header.Set("If-Modified-Since", ifModifiedSince.Format(http.TimeFormat))
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotModified {
		return &FeedResult{}, nil
	}

	feed, err := fp.Parse(resp.Body)
	if err != nil {
		return nil, err
	}

	return &FeedResult{
		Feed:         feed,
		ETag:         resp.Header.Get("ETag"),
		LastModified: resp.Header.Get("Last-Modified"),
	}, nil
}

func SaveNewFeedItems(app core.App, feed *gofeed.Feed, user string, feedId string, lastArticlePubDate time.Time) error {
	collection, err := app.FindCollectionByNameOrId("feed_items")
	if err != nil {
		return err
	}
	for _, item := range feed.Items {
		if item.PublishedParsed != nil && !item.PublishedParsed.After(lastArticlePubDate) {
			continue
		}
		existingItem, _ := app.FindFirstRecordByFilter(
			"feed_items",
			"feed = {:feed} && guid = {:guid}",
			map[string]interface{}{"feed": feedId, "guid": item.GUID},
		)
		if existingItem == nil {
			newItem := core.NewRecord(collection)
			newItem.Set("user", user)
			newItem.Set("feed", feedId)
			newItem.Set("title", item.Title)
			newItem.Set("pub_date", item.PublishedParsed)
			newItem.Set("guid", item.GUID)
			newItem.Set("description", item.Description)
			newItem.Set("url", item.Link)
			if err := app.Save(newItem); err != nil {
				return err
			}
		}
	}
	return nil
}

func FetchAllFeeds(app core.App) error {
	feeds, err := app.FindRecordsByFilter(
		"feeds",
		"last_fetched_at < {:oneHourAgo}",
		"-last_fetched_at",
		100,
		0,
		dbx.Params{
			"oneHourAgo": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		},
	)

	if err != nil {
		return fmt.Errorf("failed to find feeds: %w", err)
	}

	app.Logger().Info("Refreshing feeds...", "count", len(feeds))
	for _, feed := range feeds {
		err := FetchNewFeedItems(app, feed.Id)
		if err != nil {
			app.Logger().Error("Failed to fetch new feed items for feed", "feed", feed.Id, "error", err)
			// Continue with other feeds even if one fails
			continue
		}
	}

	return nil
}

func FetchNewFeedItems(app core.App, feedId string) error {
	feed, err := app.FindRecordById("feeds", feedId)
	if err != nil {
		return fmt.Errorf("failed to find feed: %w", err)
	}

	feedURL := feed.GetString("feed_url")
	etag := feed.GetString("etag")
	lastModified := feed.GetString("modified")
	lastModifiedTime, _ := time.Parse(http.TimeFormat, lastModified)

	feedResult, err := LoadFeedFromURL(feedURL, etag, lastModifiedTime)
	if err != nil {
		return fmt.Errorf("failed to load feed from URL: %w", err)
	}

	if feedResult.Feed == nil {
		return nil
	}

	feed.Set("etag", feedResult.ETag)
	feed.Set("modified", feedResult.LastModified)
	previousFetchTime := feed.GetDateTime("last_fetched_at").Time()
	lastFetchedAt := time.Now().UTC()
	feed.Set("last_fetched_at", lastFetchedAt.Format(time.RFC3339))
	if err := app.Save(feed); err != nil {
		return fmt.Errorf("failed to update feed record: %w", err)
	}

	if err := SaveNewFeedItems(app, feedResult.Feed, feed.GetString("user"), feedId, previousFetchTime); err != nil {
		return fmt.Errorf("failed to save new feed items: %w", err)
	}

	return nil
}

// SaveNewFeed extracts the URL from the request, loads the
// feed, and saves it to the database along with the first
// set of feed items.
func SaveNewFeed(app core.App, e *core.RequestEvent) error {
	authRecord := e.Auth
	if authRecord == nil {
		return apis.NewForbiddenError("Not authenticated", nil)
	}

	url := e.Request.FormValue("url")
	if url == "" {
		return apis.NewBadRequestError("URL is required", nil)
	}
	autoAddItems := e.Request.FormValue("auto_add_items") == "true"

	feedResult, err := LoadFeedFromURL(url, "", time.Time{})
	if err != nil {
		return apis.NewBadRequestError("Error parsing feed", err)
	}

	collection, err := app.FindCollectionByNameOrId("feeds")
	if err != nil {
		return apis.NewBadRequestError("Failed to find feeds collection", err)
	}

	record := core.NewRecord(collection)
	record.Set("user", authRecord.Id)
	record.Set("feed_url", url)
	record.Set("name", feedResult.Feed.Title)
	record.Set("description", feedResult.Feed.Description)
	if feedResult.Feed.Image != nil {
		record.Set("image_url", feedResult.Feed.Image.URL)
	}
	record.Set("etag", feedResult.ETag)
	record.Set("modified", feedResult.LastModified)
	record.Set("last_fetched_at", time.Now().UTC().Format(time.RFC3339))
	record.Set("auto_add_feed_items_to_library", autoAddItems)

	if err := app.Save(record); err != nil {
		return apis.NewBadRequestError("Failed to save feed", err)
	}

	if err := SaveNewFeedItems(app, feedResult.Feed, authRecord.Id, record.Id, time.Time{}); err != nil {
		return apis.NewBadRequestError("Failed to save feed items", err)
	}

	return e.JSON(200, map[string]interface{}{
		"id": record.Id,
	})
}

func MaybeConvertFeedItemToLink(app core.App, feedItemId string) {
	logger := app.Logger().With("action", "convertFeedItemToLink", "feedItemID", feedItemId)
	feedItem, err := app.FindRecordById("feed_items", feedItemId)
	if err != nil {
		logger.Error("Failed to find feed item", "error", err)
		return
	}

	feed, err := app.FindRecordById("feeds", feedItem.GetString("feed"))
	if err != nil {
		logger.Error("Unable to load feed", "error", err)
		return
	}

	if !feed.GetBool("auto_add_feed_items_to_library") {
		logger.Info("Skipping feed item - auto_add_feed_items_to_library is false")
		return
	}

	urlObj, err := url.Parse(feedItem.GetString("url"))
	if err != nil {
		logger.Error("Unable to parse feed item URL", "error", err)
		return
	}

	link, err := url_parser.HandleParseURLViaParams(app, feedItem.GetString("user"), urlObj, feedItem)
	if err != nil {
		logger.Error("Unable to convert feed item to link", "error", err)
		return
	} else {
		logger.Info("Converted feed item to link", "link", link.Id)
	}
}
