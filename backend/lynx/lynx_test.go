package lynx

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
	"github.com/pocketbase/pocketbase/tokens"
)

const testDataDir = "../test_pb_data"

func TestHandleParseURL(t *testing.T) {
	originalHandleParseURL := parseUrlHandlerFunc

	setupTestApp := func(t *testing.T) *tests.TestApp {
		testApp, err := tests.NewTestApp(testDataDir)
		if err != nil {
			t.Fatal(err)
		}

		// Stub!
		parseUrlHandlerFunc = func(app core.App, c echo.Context) error {
			// If authenticated, return a success response
			return c.JSON(http.StatusOK, map[string]interface{}{
				"id": "mock_id_12345",
			})
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
			Url:             "/lynx/parse_link",
			Body:            strings.NewReader("url=https://example.com"),
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"The request requires admin or record authorization token to be set."`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:   "Authenticated request with user token",
			Method: http.MethodPost,
			Url:    "/lynx/parse_link",
			Body:   strings.NewReader("url=https://example.com"),
			RequestHeaders: map[string]string{
				"Authorization": generateRecordToken("users", "test@example.com"),
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{`"id":"mock_id_12345"`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:   "Authenticated request with API key",
			Method: http.MethodPost,
			Url:    "/lynx/parse_link",
			Body:   strings.NewReader("url=https://example.com"),
			RequestHeaders: map[string]string{
				"X-API-KEY": "this_is_a_test_api_key",
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{`"id":"mock_id_12345"`},
			ExpectedEvents: map[string]int{
				"OnModelBeforeUpdate": 1,
				"OnModelAfterUpdate":  1,
			},
			TestAppFactory: setupTestApp,
			AfterTestFunc: func(t *testing.T, app *tests.TestApp, res *http.Response) {
				// Check if the API key was saved in the database
				apiKey, err := app.Dao().FindRecordById("api_keys", "qvwy0nqws813o4s")
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
			Url:    "/lynx/parse_link",
			Body:   strings.NewReader("url=https://example.com"),
			RequestHeaders: map[string]string{
				"X-API-KEY": "INVALID_API_KEY",
			},
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"Invalid or expired API key."`},
			TestAppFactory:  setupTestApp,
		},
		{
			Name:   "Request with expired API key",
			Method: http.MethodPost,
			Url:    "/lynx/parse_link",
			Body:   strings.NewReader("url=https://example.com"),
			RequestHeaders: map[string]string{
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
	setupTestApp := func(t *testing.T) *tests.TestApp {
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
			Url:    "/api/collections/links/records/8n3iq8dt6vwi4ph",
			RequestHeaders: map[string]string{
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
			Url:    "/api/collections/links/records/8n3iq8dt6vwi4ph",
			RequestHeaders: map[string]string{
				"Authorization":             generateRecordToken("users", "test2@example.com"),
				"X-Lynx-Update-Last-Viewed": "true",
			},
			ExpectedStatus:  200,
			ExpectedContent: []string{"8n3iq8dt6vwi4ph"},
			ExpectedEvents: map[string]int{
				"OnRecordViewRequest": 1,
				"OnModelBeforeUpdate": 1,
				"OnModelAfterUpdate":  1,
			},
			AfterTestFunc: func(t *testing.T, app *tests.TestApp, res *http.Response) {
				record, err := app.Dao().FindRecordById("links", "8n3iq8dt6vwi4ph")
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
	setupTestApp := func(t *testing.T) *tests.TestApp {
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
			Url:    "/lynx/generate_api_key",
			Body:   strings.NewReader(url.Values{"name": {"Test API Key"}}.Encode()),
			RequestHeaders: map[string]string{
				"Content-Type":  "application/x-www-form-urlencoded",
				"Authorization": generateRecordToken("users", "test@example.com"),
			},
			ExpectedStatus: 200,
			ExpectedEvents: map[string]int{
				"OnModelBeforeCreate": 1,
				"OnModelAfterCreate":  1,
			},
			ExpectedContent: []string{`"name":"Test API Key"`},
			TestAppFactory: setupTestApp,
			AfterTestFunc: func(t *testing.T, app *tests.TestApp, res *http.Response) {
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
				apiKey, err := app.Dao().FindRecordById("api_keys", result["id"].(string))
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
			Url:    "/lynx/generate_api_key",
			Body:   strings.NewReader(""),
			RequestHeaders: map[string]string{
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
			Url:             "/lynx/generate_api_key",
			Body:            strings.NewReader(url.Values{"name": {"Test API Key"}}.Encode()),
			ExpectedStatus:  401,
			ExpectedContent: []string{`"message":"The request requires admin or record authorization token to be set."`},
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

	record, err := app.Dao().FindAuthRecordByEmail(collectionNameOrId, email)
	if err != nil {
		return ""
	}

	token, err := tokens.NewRecordAuthToken(app, record)
	if err != nil {
		return ""
	}

	return token
}
