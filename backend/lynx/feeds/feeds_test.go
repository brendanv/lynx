package feeds

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tests"
)

const testDataDir = "../../test_pb_data"

func TestLoadFeedFromURL(t *testing.T) {
	// Set up a mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("If-None-Match") == "some-etag" {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		w.Header().Set("ETag", "new-etag")
		w.Header().Set("Last-Modified", "Wed, 21 Oct 2015 07:28:00 GMT")
		w.Write([]byte(`<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
    <channel>
      <title>Sample Feed</title>
      <description>A sample feed</description>
      <item>
        <title>Sample Item</title>
        <link>http://example.com/item</link>
        <pubDate>Wed, 21 Oct 2015 07:28:00 GMT</pubDate>
      </item>
    </channel>
    </rss>`))
	}))
	defer server.Close()

	testCases := []struct {
		name            string
		etag            string
		ifModifiedSince time.Time
		expectedResult  func(*testing.T, *FeedResult)
	}{
		{
			name:            "LoadFeedFromURL works with no etag",
			etag:            "",
			ifModifiedSince: time.Time{},
			expectedResult: func(t *testing.T, result *FeedResult) {
				if result.Feed.Title != "Sample Feed" {
					t.Errorf("Expected feed title to be 'Sample Feed', got '%s'", result.Feed.Title)
				}
				if result.Feed.Description != "A sample feed" {
					t.Errorf("Expected feed description to be 'A sample feed', got '%s'", result.Feed.Description)
				}
				if result.Feed.Items[0].Title != "Sample Item" {
					t.Errorf("Expected feed item title to be 'Sample Item', got '%s'", result.Feed.Items[0].Title)
				}
				if result.ETag != "new-etag" {
					t.Errorf("Expected etag to be 'new-etag', got '%s'", result.ETag)
				}
			},
		},
		{
			name:            "LoadFeedFromURL returns empty response on 304",
			etag:            "some-etag",
			ifModifiedSince: time.Time{},
			expectedResult: func(t *testing.T, result *FeedResult) {
				if result.Feed != nil {
					t.Errorf("Expected feed to be nil, got '%+v'", result.Feed)
				}
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := LoadFeedFromURL(server.URL, tc.etag, tc.ifModifiedSince)
			if err != nil {
				t.Fatal(err)
			}
			tc.expectedResult(t, result)
		})
	}
}

func TestFetchNewFeedItems(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("If-None-Match") == "initial-etag" {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		w.Header().Set("ETag", "new-etag")
		w.Header().Set("Last-Modified", "Wed, 21 Oct 2015 07:28:00 GMT")
		w.Write([]byte(`<?xml version="1.0" encoding="UTF-8"?>
		<rss version="2.0">
		<channel>
			<title>Test Feed</title>
			<description>A test feed</description>
			<item>
				<title>New Item</title>
				<link>http://example.com/new-item</link>
				<guid>http://example.com/new-item</guid>
				<pubDate>Wed, 21 Oct 2015 07:28:00 GMT</pubDate>
				<description>This is a new item</description>
			</item>
		</channel>
		</rss>`))
	}))
	defer server.Close()

	testApp, err := tests.NewTestApp(testDataDir)
	if err != nil {
		t.Fatal(err)
	}
	defer testApp.Cleanup()

	feedCollection, err := testApp.Dao().FindCollectionByNameOrId("feeds")
	if err != nil {
		t.Fatal(err)
	}
	feed := models.NewRecord(feedCollection)
	feed.Set("feed_url", server.URL)
	feed.Set("etag", "non-matching-etag")
	feed.Set("modified", "Tue, 20 Oct 2015 07:28:00 GMT")
	feed.Set("last_fetched_at", "Tue, 20 Oct 2015 07:28:00 GMT")
	feed.Set("user", "test-user")
	if err := testApp.Dao().SaveRecord(feed); err != nil {
		t.Fatal(err)
	}

	err = FetchNewFeedItems(testApp, feed.Id)
	if err != nil {
		t.Fatalf("FetchNewFeedItems failed: %v", err)
	}

	updatedFeed, err := testApp.Dao().FindRecordById("feeds", feed.Id)
	if err != nil {
		t.Fatal(err)
	}
	if updatedFeed.GetString("etag") != "new-etag" {
		t.Errorf("Expected etag to be 'new-etag', got '%s'", updatedFeed.GetString("etag"))
	}
	if updatedFeed.GetString("modified") != "Wed, 21 Oct 2015 07:28:00 GMT" {
		t.Errorf("Expected modified to be 'Wed, 21 Oct 2015 07:28:00 GMT', got '%s'", updatedFeed.GetString("modified"))
	}

	feedItems, err := testApp.Dao().FindRecordsByFilter("feed_items", "feed = {:feed}", "created", 100, 0, dbx.Params{"feed": feed.Id})
	if err != nil {
		t.Fatal(err)
	}
	if len(feedItems) != 1 {
		t.Errorf("Expected 1 feed item, got %d", len(feedItems))
	}
	if feedItems[0].GetString("title") != "New Item" {
		t.Errorf("Expected feed item title to be 'New Item', got '%s'", feedItems[0].GetString("title"))
	}

	// Test no changes when feed hasn't been modified
	err = FetchNewFeedItems(testApp, feed.Id)
	if err != nil {
		t.Fatalf("Second FetchNewFeedItems failed: %v", err)
	}
	newFeedItems, err := testApp.Dao().FindRecordsByFilter("feed_items", "feed = {:feed}", "created", 100, 0, dbx.Params{"feed": feed.Id})
	if err != nil {
		t.Fatal(err)
	}
	if len(newFeedItems) != 1 {
		t.Errorf("Expected 1 feed item after second fetch, got %d", len(feedItems))
	}
}
