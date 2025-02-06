package lynx

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

const testDataDir = "../test_pb_data"

func TestHandleParseURL(t *testing.T) {
	originalHandleParseURL := parseUrlHandlerFunc

	setupTestApp := func(t testing.TB) *tests.TestApp {
		testApp, err := tests.NewTestApp(testDataDir)
		if err != nil {
			t.Fatal(err)
		}

		// Stub!
		parseUrlHandlerFunc = func(app core.App, c *core.RequestEvent) (*core.Record, error) {
			// Create a mock record
			mockRecord := &core.Record{}
			mockRecord.Id = "mock_id_12345"
			return mockRecord, nil
		}

		InitializePocketbase(testApp)

		return testApp
	}

	t.Cleanup(func() {
		parseUrlHandlerFunc = originalHandleParseURL
	})

	scenarios := []tests.ApiScenario{
		{
			Name:            "Unauthenticated request",
			Method:          http.MethodPost,
			URL:             "/lynx/parse_link",
			Body:            strings.NewReader("url=https://example.com"),
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"The request requires valid record authorization token."`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:   "Authenticated request with user token",
			Method: http.MethodPost,
			URL:    "/lynx/parse_link",
			Body:   strings.NewReader("url=https://example.com"),
			Headers: map[string]string{
				"Authorization": generateRecordToken("users", "test@example.com"),
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{`"id":"mock_id_12345"`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:   "Authenticated request with API key",
			Method: http.MethodPost,
			URL:    "/lynx/parse_link",
			Body:   strings.NewReader("url=https://example.com"),
			Headers: map[string]string{
				"X-API-KEY": "this_is_a_test_api_key",
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{`"id":"mock_id_12345"`},
			ExpectedEvents: map[string]int{
				"OnRecordUpdate": 1,
				"OnRecordAfterUpdateSuccess":  1,
			},
			TestAppFactory: setupTestApp,
			AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
				// Check if the API key was saved in the database
				apiKey, err := app.FindRecordById("api_keys", "qvwy0nqws813o4s")
				if err != nil {
					t.Fatal("Failed to find the existing API key in the database")
				}

				lastUsedAt := apiKey.GetDateTime("last_used_at")
				if lastUsedAt.IsZero() {
					t.Fatal("last_used_at was not updated")
				}
				if time.Since(lastUsedAt.Time()) > time.Minute {
					t.Fatal("last_used_at was not updated recently")
				}
			},
		},
		{
			Name:   "Request with invalid API key",
			Method: http.MethodPost,
			URL:    "/lynx/parse_link",
			Body:   strings.NewReader("url=https://example.com"),
			Headers: map[string]string{
				"X-API-KEY": "INVALID_API_KEY",
			},
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"Invalid or expired API key."`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:   "Request with expired API key",
			Method: http.MethodPost,
			URL:    "/lynx/parse_link",
			Body:   strings.NewReader("url=https://example.com"),
			Headers: map[string]string{
				"X-API-KEY": "this_key_is_expired",
			},
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"Invalid or expired API key."`},
			TestAppFactory:  setupTestApp,
		},
	}

	for _, scenario := range scenarios {
		scenario.Test(t)
	}
}

func TestOnRecordViewRequest(t *testing.T) {
	setupTestApp := func(t testing.TB) *tests.TestApp {
		testApp, err := tests.NewTestApp(testDataDir)
		if err != nil {
			t.Fatal(err)
		}

		InitializePocketbase(testApp)

		return testApp
	}

	scenarios := []tests.ApiScenario{
		{
			Name:   "View link without update header",
			Method: http.MethodGet,
			URL:    "/api/collections/links/records/8n3iq8dt6vwi4ph",
			Headers: map[string]string{
				"Authorization": generateRecordToken("users", "test2@example.com"),
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{"8n3iq8dt6vwi4ph"},
			ExpectedEvents: map[string]int{
				"OnRecordViewRequest": 1,
			},
			TestAppFactory: setupTestApp,
		},
		{
			Name:   "View link with update header",
			Method: http.MethodGet,
			URL:    "/api/collections/links/records/8n3iq8dt6vwi4ph",
			Headers: map[string]string{
				"Authorization":             generateRecordToken("users", "test2@example.com"),
				"X-Lynx-Update-Last-Viewed": "true",
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{"8n3iq8dt6vwi4ph"},
			ExpectedEvents: map[string]int{
				"OnRecordViewRequest":       1,
				"OnRecordUpdate":            1,
				"OnModelAfterUpdateSuccess": 1,
			},
			AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
				record, err := app.FindRecordById("links", "8n3iq8dt6vwi4ph")
				if err != nil {
					t.Fatal(err)
				}
				lastViewedAt := record.GetDateTime("last_viewed_at")
				if lastViewedAt.IsZero() {
					t.Fatal("last_viewed_at was not updated")
				}
				if time.Since(lastViewedAt.Time()) > time.Minute {
					t.Fatal("last_viewed_at was not updated recently")
				}
			},
			TestAppFactory: setupTestApp,
		},
	}

	for _, scenario := range scenarios {
		scenario.Test(t)
	}
}

func TestHandleGenerateAPIKey(t *testing.T) {
	setupTestApp := func(t testing.TB) *tests.TestApp {
		testApp, err := tests.NewTestApp(testDataDir)
		if err != nil {
			t.Fatal(err)
		}

		InitializePocketbase(testApp)

		return testApp
	}

	scenarios := []tests.ApiScenario{
		{
			Name:   "Generate API key with valid user and name",
			Method: http.MethodPost,
			URL:    "/lynx/generate_api_key",
			Body:   strings.NewReader(url.Values{"name": {"Test API Key"}}.Encode()),
			Headers: map[string]string{
				"Content-Type":  "application/x-www-form-urlencoded",
				"Authorization": generateRecordToken("users", "test@example.com"),
			},
			ExpectedStatus: 200,
			ExpectedEvents: map[string]int{
				"OnRecordCreate":             1,
				"OnRecordAfterCreateSuccess": 1,
			},
			ExpectedContent: []string{`"name":"Test API Key"`},
			TestAppFactory:  setupTestApp,
			AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
				var result map[string]interface{}
				if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
					t.Fatal(err)
				}

				// Check if the response contains the expected fields
				if name, ok := result["name"].(string); !ok || name != "Test API Key" {
					t.Fatalf("Expected name 'Test API Key', got %v", name)
				}
				if _, ok := result["api_key"].(string); !ok {
					t.Fatal("Expected api_key to be a string")
				}
				if _, ok := result["expires_at"].(string); !ok {
					t.Fatal("Expected expires_at to be a string")
				}
				if _, ok := result["id"].(string); !ok {
					t.Fatal("Expected expires_at to be a string")
				}

				// Check if the API key was saved in the database
				apiKey, err := app.FindRecordById("api_keys", result["id"].(string))
				if err != nil {
					t.Fatal("Failed to find the created API key in the database")
				}

				// Check if the expiration date is roughly 6 months in the future
				expiresAt := apiKey.GetDateTime("expires_at")
				expectedExpiration := time.Now().AddDate(0, 6, 0)

				// Convert types.DateTime to time.Time for comparison
				expiresAtTime := expiresAt.Time()

				timeDiff := expiresAtTime.Sub(expectedExpiration)
				if timeDiff < -24*time.Hour || timeDiff > 24*time.Hour {
					t.Fatalf("Expiration date is not within 24 hours of the expected 6 months: got %v, expected close to %v", expiresAtTime, expectedExpiration)
				}
			},
		},
		{
			Name:   "Generate API key without name",
			Method: http.MethodPost,
			URL:    "/lynx/generate_api_key",
			Body:   strings.NewReader(""),
			Headers: map[string]string{
				"Content-Type":  "application/x-www-form-urlencoded",
				"Authorization": generateRecordToken("users", "test@example.com"),
			},
			ExpectedStatus:  400,
			ExpectedContent: []string{`"message":"'name' parameter is required."`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:            "Generate API key without authentication",
			Method:          http.MethodPost,
			URL:             "/lynx/generate_api_key",
			Body:            strings.NewReader(url.Values{"name": {"Test API Key"}}.Encode()),
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"The request requires valid record authorization token."`},
			TestAppFactory:  setupTestApp,
		},
	}

	for _, scenario := range scenarios {
		scenario.Test(t)
	}
}

func generateRecordToken(collectionNameOrId string, email string) string {
	app, err := tests.NewTestApp(testDataDir)
	if err != nil {
		return ""
	}
	defer app.Cleanup()

	record, err := app.FindAuthRecordByEmail(collectionNameOrId, email)
	if err != nil {
		return ""
	}

	token, err := record.NewAuthToken()
	if err != nil {
		return ""
	}

	return token
}

func TestSummarizationHook(t *testing.T) {
	setupTestApp := func(t testing.TB) *tests.TestApp {
		testApp, err := tests.NewTestApp(testDataDir)
		if err != nil {
			t.Fatal(err)
		}
		InitializePocketbase(testApp)
		return testApp
	}
	summarizeCalled := false
	originalSummarizer := CurrentSummarizer
	scenarios := []tests.ApiScenario{
		{
			Name:   "Create link and trigger summarization hook",
			Method: http.MethodPost,
			URL:    "/api/collections/links/records",
			Body:   strings.NewReader(generateValidLinkJSON(t)),
			Headers: map[string]string{
				"Content-Type":  "application/json",
				"Authorization": generateRecordToken("users", "test@example.com"),
			},
			ExpectedStatus: 200,
			ExpectedEvents: map[string]int{
				"OnRecordCreate":             1,
				"OnRecordAfterCreateSuccess": 1,
			},
			ExpectedContent: []string{"example.com"},
			TestAppFactory:  setupTestApp,
			BeforeTestFunc: func(t testing.TB, app *tests.TestApp, e *core.ServeEvent) {
				CurrentSummarizer = &MockSummarizer{
					MaybeSummarizeLinkFunc: func(app core.App, linkID string) {
						summarizeCalled = true
					},
				}
			},
			AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
				time.Sleep(100 * time.Millisecond)

				if !summarizeCalled {
					t.Fatal("MaybeSummarizeLink was not called after link creation")
				}
			},
		},
	}
	for _, scenario := range scenarios {
		scenario.Test(t)
	}
	// Reset the original summarizer
	CurrentSummarizer = originalSummarizer
}

type MockSummarizer struct {
	MaybeSummarizeLinkFunc func(app core.App, linkID string)
}

func (m *MockSummarizer) MaybeSummarizeLink(app core.App, linkID string) {
	if m.MaybeSummarizeLinkFunc != nil {
		m.MaybeSummarizeLinkFunc(app, linkID)
	}
}

func generateValidLinkJSON(t testing.TB) string {
	link := map[string]interface{}{
		"title":             "Test Link",
		"original_url":      "https://example.com",
		"cleaned_url":       "https://example.com",
		"hostname":          "example.com",
		"user":              "h4oofx0tx2eupnq", // test@example.com
		"added_to_library":  time.Now().Format(time.RFC3339),
		"excerpt":           "This is a test excerpt",
		"raw_text_content":  "This is the raw text content of the test link",
		"read_time_seconds": 60,
		"read_time_display": "1 min",
	}

	jsonData, err := json.Marshal(link)
	if err != nil {
		t.Fatalf("Failed to marshal link data: %v", err)
	}

	return string(jsonData)
}

func TestHandleParseFeed(t *testing.T) {
	originalParseFeedHandler := parseFeedHandlerFunc

	setupTestApp := func(t testing.TB) *tests.TestApp {
		testApp, err := tests.NewTestApp(testDataDir)
		if err != nil {
			t.Fatal(err)
		}

		// Mock the feed parsing function
		parseFeedHandlerFunc = func(app core.App, c *core.RequestEvent) error {
			return c.JSON(http.StatusOK, map[string]interface{}{
				"id": "mock_feed_id_12345",
			})
		}

		InitializePocketbase(testApp)

		return testApp
	}

	t.Cleanup(func() {
		parseFeedHandlerFunc = originalParseFeedHandler
	})

	scenarios := []tests.ApiScenario{
		{
			Name:            "Unauthenticated request",
			Method:          http.MethodPost,
			URL:             "/lynx/parse_feed",
			Body:            strings.NewReader("url=https://example.com/feed"),
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"The request requires valid record authorization token."`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:   "Authenticated request with user token",
			Method: http.MethodPost,
			URL:    "/lynx/parse_feed",
			Body:   strings.NewReader("url=https://example.com/feed"),
			Headers: map[string]string{
				"Authorization": generateRecordToken("users", "test@example.com"),
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{`"id":"mock_feed_id_12345"`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:   "Authenticated request with API key",
			Method: http.MethodPost,
			URL:    "/lynx/parse_feed",
			Body:   strings.NewReader("url=https://example.com/feed"),
			Headers: map[string]string{
				"X-API-KEY": "this_is_a_test_api_key",
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{`"id":"mock_feed_id_12345"`},
			ExpectedEvents: map[string]int{
				"OnRecordUpdate":             1,
				"OnRecordAfterUpdateSuccess": 1,
			},
			TestAppFactory: setupTestApp,
			AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
				// Check if the API key was updated in the database
				apiKey, err := app.FindRecordById("api_keys", "qvwy0nqws813o4s")
				if err != nil {
					t.Fatal("Failed to find the existing API key in the database")
				}

				lastUsedAt := apiKey.GetDateTime("last_used_at")
				if lastUsedAt.IsZero() {
					t.Fatal("last_used_at was not updated")
				}
				if time.Since(lastUsedAt.Time()) > time.Minute {
					t.Fatal("last_used_at was not updated recently")
				}
			},
		},
		{
			Name:   "Request with invalid API key",
			Method: http.MethodPost,
			URL:    "/lynx/parse_feed",
			Body:   strings.NewReader("url=https://example.com/feed"),
			Headers: map[string]string{
				"X-API-KEY": "INVALID_API_KEY",
			},
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"Invalid or expired API key."`},
			TestAppFactory:  setupTestApp,
		},
	}

	for _, scenario := range scenarios {
		scenario.Test(t)
	}
}

func createTestFeedItem(app core.App, feedID string, userID string) (*core.Record, error) {
	collection, err := app.FindCollectionByNameOrId("feed_items")
	if err != nil {
		return nil, err
	}
	feedItem := core.NewRecord(collection)
	feedItem.Set("feed", feedID)
	feedItem.Set("user", userID)
	feedItem.Set("title", "Test Feed Item")
	feedItem.Set("url", "https://example.com/item")
	if err := app.Save(feedItem); err != nil {
		return nil, err
	}
	return feedItem, nil
}

func TestOnModelAfterCreateFeedItems(t *testing.T) {
	setupTestApp := func(t testing.TB) *tests.TestApp {
		testApp, err := tests.NewTestApp(testDataDir)
		if err != nil {
			t.Fatal(err)
		}

		InitializePocketbase(testApp)

		return testApp
	}

	testApp := setupTestApp(t)
	defer testApp.Cleanup()

	convertCalled := false
	originalConvertFunc := convertFeedItemToLinkFunc
	convertFeedItemToLinkFunc = func(app core.App, feedItemID string) {
		convertCalled = true
	}
	t.Cleanup(func() {
		convertFeedItemToLinkFunc = originalConvertFunc
	})

	// Create a test feed
	feedCollection, err := testApp.FindCollectionByNameOrId("feeds")
	if err != nil {
		t.Fatal(err)
	}
	feed := core.NewRecord(feedCollection)
	feed.Set("feed_url", "https://example.com/feed")
	feed.Set("name", "test feed")
	feed.Set("user", "h4oofx0tx2eupnq")
	if err := testApp.Save(feed); err != nil {
		t.Fatal(err)
	}

	// Create a test feed item
	feedItem, err := createTestFeedItem(testApp, feed.Id, "h4oofx0tx2eupnq")
	if err != nil {
		t.Fatal(err)
	}
	if feedItem == nil {
		t.Fatal("Expected non-nil feed item")
	}

	// Wait a short time for the goroutine to execute
	time.Sleep(100 * time.Millisecond)

	// Check if convertFeedItemToLinkFunc was called
	if !convertCalled {
		t.Error("convertFeedItemToLinkFunc was not called after feed item creation")
	}
}
