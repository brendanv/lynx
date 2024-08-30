package url_parser

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tests"
	"github.com/stretchr/testify/assert"
)

func TestHandleParseURL(t *testing.T) {
	testApp, err := tests.NewTestApp("../../test_pb_data")
	if err != nil {
		t.Fatal(err)
	}
	defer testApp.Cleanup()

	user, err := createTestUser(testApp)
	if err != nil {
		t.Fatal(err)
	}

	feed, err := createTestFeed(testApp, user.Id)
	if err != nil {
		t.Fatal(err)
	}
	if feed == nil {
		t.Fatal("failed to create test feed")
	}

	feed_item, err := createTestFeedItem(testApp, feed.Id, user.Id)
	if err != nil {
		t.Fatal(err)
	}
	if feed_item == nil {
		t.Fatal("failed to create test feed item")
	}

	tests := []struct {
		name            string
		url             string
		feedItemId      string
		setupMockServer func() *httptest.Server
		expectError     bool
		expectedTitle   string
	}{
		{
			name:       "Successful parsing",
			url:        "https://example.com",
			feedItemId: "",
			setupMockServer: func() *httptest.Server {
				return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Content-Type", "text/html")
					w.Write([]byte(`<html><head><title>Test Article</title></head><body><h1>Test Article</h1><p>Content</p></body></html>`))
				}))
			},
			expectError:   false,
			expectedTitle: "Test Article",
		},
		{
			name:       "Cookie passing",
			url:        "https://example.com",
			feedItemId: "",
			setupMockServer: func() *httptest.Server {
				server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					cookie := r.Header.Get("Cookie")
					if cookie != "test_cookie=test_value" {
						http.Error(w, "Unauthorized", http.StatusUnauthorized)
						return
					}
					w.Header().Set("Content-Type", "text/html")
					w.Write([]byte(`<html><head><title>Cookie Test</title></head><body><h1>Cookie Test</h1><p>Content</p></body></html>`))
				}))
				// Create test cookies for this specific server
				createTestCookies(testApp, user.Id, server.URL)
				return server
			},
			expectError:   false,
			expectedTitle: "Cookie Test",
		},
		{
			name:            "Invalid URL",
			url:             "invalid-url",
			feedItemId:      "",
			setupMockServer: func() *httptest.Server { return nil },
			expectError:     true,
			expectedTitle:   "",
		},
		{
			name:       "Server error",
			url:        "https://example.com",
			feedItemId: "",
			setupMockServer: func() *httptest.Server {
				return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusInternalServerError)
				}))
			},
			expectError:   true,
			expectedTitle: "",
		},
		{
			name:       "Successful parsing with feed item",
			url:        "https://example.com",
			feedItemId: feed_item.Id,
			setupMockServer: func() *httptest.Server {
				return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Content-Type", "text/html")
					w.Write([]byte(`<html><head><title>Test Article</title></head><body><h1>Test Article</h1><p>Content</p></body></html>`))
				}))
			},
			expectError:   false,
			expectedTitle: "Test Article",
		},
		{
			name:       "Successful parsing with invalid feed item",
			url:        "https://example.com",
			feedItemId: "invalid feed id",
			setupMockServer: func() *httptest.Server {
				return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Content-Type", "text/html")
					w.Write([]byte(`<html><head><title>Test Article</title></head><body><h1>Test Article</h1><p>Content</p></body></html>`))
				}))
			},
			expectError:   true,
			expectedTitle: "",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			mockServer := tc.setupMockServer()
			if mockServer != nil {
				defer mockServer.Close()
				tc.url = mockServer.URL
			}

			e := echo.New()
			form := url.Values{}
			form.Set("url", tc.url)
			if tc.feedItemId != "" {
				form.Set("feed_item", tc.feedItemId)
			}

			req := httptest.NewRequest(http.MethodPost, "/lynx/parse_url", strings.NewReader(form.Encode()))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)
			rec := httptest.NewRecorder()

			c := e.NewContext(req, rec)
			c.Set(apis.ContextAuthRecordKey, user)

			record, err := HandleParseURL(testApp, c)

			if tc.expectError {
				assert.Error(t, err)
				assert.Nil(t, record)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, record)
				assert.Equal(t, tc.expectedTitle, record.Get("title"))
				assert.Equal(t, tc.url, record.Get("original_url"))
				assert.Equal(t, user.Id, record.Get("user"))
				if tc.feedItemId != "" {
					assert.Equal(t, feed.Id, record.Get("created_from_feed"))
					updateFeedItem, err := testApp.Dao().FindRecordById("feed_items", tc.feedItemId)
					if err != nil {
						t.Fatal(err)
					}
					assert.Equal(t, record.Id, updateFeedItem.Get("saved_as_link"))
				} else {
					assert.Equal(t, "", record.Get("created_from_feed"))
				}
			}
		})
	}
}

func createTestUser(app *tests.TestApp) (*models.Record, error) {
	collection, err := app.Dao().FindCollectionByNameOrId("users")
	if err != nil {
		return nil, err
	}

	user := models.NewRecord(collection)
	user.Set("email", "testurlparser@example.com")
	user.Set("username", "testurlparser")
	user.Set("password", "password123")

	if err := app.Dao().SaveRecord(user); err != nil {
		return nil, err
	}

	return user, nil
}

func createTestCookies(app *tests.TestApp, userId string, serverURL string) error {
	collection, err := app.Dao().FindCollectionByNameOrId("user_cookies")
	if err != nil {
		return err
	}

	parsedURL, err := url.Parse(serverURL)
	if err != nil {
		return err
	}

	cookie := models.NewRecord(collection)
	cookie.Set("user", userId)
	cookie.Set("domain", parsedURL.Hostname())
	cookie.Set("name", "test_cookie")
	cookie.Set("value", "test_value")

	if err := app.Dao().SaveRecord(cookie); err != nil {
		return err
	}

	return nil
}

func createTestFeed(app core.App, userID string) (*models.Record, error) {
	collection, err := app.Dao().FindCollectionByNameOrId("feeds")
	if err != nil {
		return nil, err
	}
	feed := models.NewRecord(collection)
	feed.Set("user", userID)
	feed.Set("feed_url", "https://example.com/feed")
	feed.Set("name", "Test Feed")
	if err := app.Dao().SaveRecord(feed); err != nil {
		return nil, err
	}
	return feed, nil
}

func createTestFeedItem(app core.App, feedID string, userID string) (*models.Record, error) {
	collection, err := app.Dao().FindCollectionByNameOrId("feed_items")
	if err != nil {
		return nil, err
	}
	feedItem := models.NewRecord(collection)
	feedItem.Set("feed", feedID)
	feedItem.Set("user", userID)
	feedItem.Set("title", "Test Feed Item")
	feedItem.Set("url", "https://example.com/item")
	if err := app.Dao().SaveRecord(feedItem); err != nil {
		return nil, err
	}
	return feedItem, nil
}
