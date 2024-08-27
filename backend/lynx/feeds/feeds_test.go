package feeds

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

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
