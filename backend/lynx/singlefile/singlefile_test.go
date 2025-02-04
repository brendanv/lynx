package singlefile

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

func TestMaybeArchiveLink(t *testing.T) {
	testApp, err := tests.NewTestApp("../../test_pb_data")
	if err != nil {
		t.Fatal(err)
	}
	defer testApp.Cleanup()

	// Variable to track if the server was hit
	var serverHit bool

	// Create a test server to mock the SingleFile service
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		serverHit = true
		switch r.URL.Query().Get("status") {
		case "error":
			w.WriteHeader(http.StatusInternalServerError)
		case "empty":
			w.WriteHeader(http.StatusOK)
		default:
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("<html><body>Archived content</body></html>"))
		}
	}))
	defer server.Close()

	testCases := []struct {
		name                string
		setupEnv            func()
		cleanupEnv          func()
		expectedResult      func(*testing.T, core.App, string, bool)
		cleanupFileIfExists bool
	}{
		{
			name: "SINGLEFILE_URL not set",
			setupEnv: func() {
				os.Unsetenv("SINGLEFILE_URL")
			},
			cleanupEnv: func() {},
			expectedResult: func(t *testing.T, app core.App, linkID string, hit bool) {
				link, err := app.FindRecordById("links", linkID)
				if err != nil {
					t.Fatalf("Failed to find link: %v", err)
				}
				if link.GetString("archive") != "" {
					t.Error("Expected archive field to be empty, but it was set")
				}
				if hit {
					t.Error("Expected server not to be hit, but it was")
				}
			},
			cleanupFileIfExists: true,
		},
		{
			name: "SINGLEFILE_URL set - successful response",
			setupEnv: func() {
				os.Setenv("SINGLEFILE_URL", server.URL)
			},
			cleanupEnv: func() {
				os.Unsetenv("SINGLEFILE_URL")
			},
			expectedResult: func(t *testing.T, app core.App, linkID string, hit bool) {
				link, err := app.FindRecordById("links", linkID)
				if err != nil {
					t.Fatalf("Failed to find link: %v", err)
				}
				archive := link.GetString("archive")
				if archive == "" {
					t.Error("Expected archive field to be set, but it was empty")
				}

				fs, err := app.NewFilesystem()
				if err != nil {
					t.Fatal(err)
				}
				defer fs.Close()

				exists, err := fs.Exists(link.BaseFilesPath() + "/" + archive)
				if err != nil {
					t.Fatal(err)
				}
				if !exists {
					t.Error("Expected archive file to exist, but it doesn't")
				}
				if !hit {
					t.Error("Expected server to be hit, but it wasn't")
				}
			},
			cleanupFileIfExists: true,
		},
		{
			name: "SINGLEFILE_URL set - unsuccessful response",
			setupEnv: func() {
				os.Setenv("SINGLEFILE_URL", server.URL+"?status=error")
			},
			cleanupEnv: func() {
				os.Unsetenv("SINGLEFILE_URL")
			},
			expectedResult: func(t *testing.T, app core.App, linkID string, hit bool) {
				link, err := app.FindRecordById("links", linkID)
				if err != nil {
					t.Fatalf("Failed to find link: %v", err)
				}
				if link.GetString("archive") != "" {
					t.Error("Expected archive field to be empty, but it was set")
				}
				if !hit {
					t.Error("Expected server to be hit, but it wasn't")
				}
			},
			cleanupFileIfExists: true,
		},
		{
			name: "SINGLEFILE_URL set - empty response",
			setupEnv: func() {
				os.Setenv("SINGLEFILE_URL", server.URL+"?status=empty")
			},
			cleanupEnv: func() {
				os.Unsetenv("SINGLEFILE_URL")
			},
			expectedResult: func(t *testing.T, app core.App, linkID string, hit bool) {
				link, err := app.FindRecordById("links", linkID)
				if err != nil {
					t.Fatalf("Failed to find link: %v", err)
				}
				if link.GetString("archive") != "" {
					t.Error("Expected archive field to be empty, but it was set")
				}
				if !hit {
					t.Error("Expected server to be hit, but it wasn't")
				}
			},
			cleanupFileIfExists: true,
		},
		{
			name: "Link already archived",
			setupEnv: func() {
				os.Setenv("SINGLEFILE_URL", server.URL)
				link, err := testApp.FindRecordById("links", "8n3iq8dt6vwi4ph")
				if err != nil {
					t.Fatalf("Failed to find link: %v", err)
				}
				link.Set("archive", "pre_existing_archive.html")
				if err := testApp.SaveNoValidate(link); err != nil {
					t.Fatalf("Failed to update link with pre-existing archive: %v", err)
				}
			},
			cleanupEnv: func() {
				os.Unsetenv("SINGLEFILE_URL")
				link, _ := testApp.FindRecordById("links", "8n3iq8dt6vwi4ph")
				link.Set("archive", "")
				testApp.Save(link)
			},
			expectedResult: func(t *testing.T, app core.App, linkID string, hit bool) {
				link, err := app.FindRecordById("links", linkID)
				if err != nil {
					t.Fatalf("Failed to find link: %v", err)
				}
				if link.GetString("archive") != "pre_existing_archive.html" {
					t.Error("Expected archive field to remain unchanged")
				}
				if hit {
					t.Error("Expected server not to be hit, but it was")
				}
			},
			cleanupFileIfExists: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.setupEnv()
			defer tc.cleanupEnv()

			serverHit = false

			MaybeArchiveLink(testApp, "8n3iq8dt6vwi4ph")

			tc.expectedResult(t, testApp, "8n3iq8dt6vwi4ph", serverHit)

			link, err := testApp.FindRecordById("links", "8n3iq8dt6vwi4ph")
			if err != nil {
				t.Fatalf("Failed to find link after test: %v", err)
			}
			if archive := link.GetString("archive"); archive != "" {
				if tc.cleanupFileIfExists {
					fs, err := testApp.NewFilesystem()
					if err != nil {
						t.Fatalf("Failed to create filesystem for cleanup: %v", err)
					}
					defer fs.Close()

					err = fs.Delete(link.BaseFilesPath() + "/" + archive)
					if err != nil {
						t.Fatalf("Failed to delete archive file: %v", err)
					}
				}

				// Reset the archive field in the database
				link.Set("archive", "")
				if err := testApp.Save(link); err != nil {
					t.Fatalf("Failed to reset archive field: %v", err)
				}
			}
		})
	}
}

func TestGetUserCookiesJSON(t *testing.T) {
	testApp, err := tests.NewTestApp("../../test_pb_data")
	if err != nil {
		t.Fatal(err)
	}
	defer testApp.Cleanup()

	cookiesJSON, err := getUserCookiesJSON(testApp, "c0qbygabvsrlixp", "https://www.example.com")
	if err != nil {
		t.Fatal(err)
	}

	var cookies []string
	err = json.Unmarshal([]byte(cookiesJSON), &cookies)
	if err != nil {
		t.Fatal(err)
	}
	if len(cookies) != 1 {
		t.Error("Expected exactly one cookie, but got none")
	}
}
