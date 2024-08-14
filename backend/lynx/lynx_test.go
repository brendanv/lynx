package lynx

import (
	"net/http"
	"strings"
	"testing"

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
			Name:   "Authenticated request",
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
