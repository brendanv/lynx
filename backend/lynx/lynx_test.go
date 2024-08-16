package lynx

import (
	"net/http"
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
			TestAppFactory:  setupTestApp,
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
			ExpectedStatus: 200,
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
			ExpectedStatus: 200,
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
