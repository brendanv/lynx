package url_parser

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/apis"
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

	tests := []struct {
		name            string
		url             string
		setupMockServer func() *httptest.Server
		expectError     bool
		expectedTitle   string
	}{
		{
			name: "Successful parsing",
			url:  "https://example.com",
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
			name: "Cookie passing",
			url:  "https://example.com",
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
			setupMockServer: func() *httptest.Server { return nil },
			expectError:     true,
			expectedTitle:   "",
		},
		{
			name: "Server error",
			url:  "https://example.com",
			setupMockServer: func() *httptest.Server {
				return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
          w.WriteHeader(http.StatusInternalServerError)
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
