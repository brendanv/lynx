package singlefile

// If the environment variable SINGLEFILE_URL is set,
// this will send a request to that url to create an
// archive. The resulting html will be saved as a
// file attachment to the link.

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

const (
	charset   = "abcdefghijklmnopqrstuvwxyz0123456789"
	randomLen = 10
)

var seededRand *rand.Rand = rand.New(rand.NewSource(time.Now().UnixNano()))

func generateFilenameSuffix() string {
	b := make([]byte, randomLen)
	for i := range b {
		b[i] = charset[seededRand.Intn(len(charset))]
	}
	return string(b)
}

func MaybeArchiveLink(app core.App, linkID string) {
	logger := app.Logger().With("action", "createArchive", "linkID", linkID)

	link, err := app.FindRecordById("links", linkID)
	if err != nil {
		logger.Error("Failed to find link", "error", err)
		return
	}

	if link.GetString("archive") != "" {
		logger.Info("Link already archived, skipping")
		return
	}

	singlefileURL := os.Getenv("SINGLEFILE_URL")
	if singlefileURL == "" {
		logger.Info("SINGLEFILE_URL not set, skipping archive creation")
		return
	}

	originalURL := link.GetString("original_url")
	if originalURL == "" {
		logger.Error("Link has no original_url")
		return
	}

	// Create a file using Pocketbase's filesystem
	// fileKey = the name. This is what is stored on the model
	// fileName = the full path including the directory for
	// the link record. This should not be stored on the
	// model beacuse it's computed by pocketbase
	fileKey := fmt.Sprintf("archive_%s.html", generateFilenameSuffix())
	fileName := link.BaseFilesPath() + "/" + fileKey
	fs, err := app.NewFilesystem()
	if err != nil {
		logger.Error("Failed to create filesystem", "error", err)
		return
	}
	defer fs.Close()

	exists, err := fs.Exists(fileName)
	if exists || err != nil {
		logger.Info("Skipping archive creation, file already exists")
		return
	}

	userID := link.GetString("user")
	cookiesJSON, err := getUserCookiesJSON(app, userID, originalURL)
	if err != nil {
		logger.Error("Failed to get user cookies", "error", err)
		// Continue without cookies if there's an error
	}

	formData := url.Values{}
	formData.Set("url", originalURL)
	if cookiesJSON != "" {
		formData.Set("cookies", cookiesJSON)
	}
	client := &http.Client{
		Timeout: 60 * time.Second,
	}
	resp, err := client.PostForm(singlefileURL, formData)
	if err != nil {
		logger.Error("Failed to send request to singlefile service", "error", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Error("Singlefile service returned non-OK status", "statusCode", resp.StatusCode)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error("Failed to read response body", "error", err)
		return
	}

	if len(body) == 0 {
		logger.Error("Received empty response from singlefile service")
		return
	}

	fsFile, err := filesystem.NewFileFromBytes(body, fileName)
	if err != nil {
		logger.Error("Failed to create archive file", "error", err)
		return
	}

	err = fs.UploadFile(fsFile, fileName)
	if err != nil {
		logger.Error("Failed to upload archive file", "error", err)
		return
	}

	err = app.RunInTransaction(func(txApp core.App) error {
		updatedLink, err := txApp.FindRecordById("links", linkID)
		if err != nil {
			return err
		}
		updatedLink.Set("archive", fileKey)
		if err := txApp.Save(updatedLink); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.Error("Failed to update link with archive information", "error", err)
		return
	}

	logger.Info("Successfully created archive for link")
}

func getUserCookiesJSON(app core.App, userID string, urlStr string) (string, error) {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return "", fmt.Errorf("failed to parse URL: %w", err)
	}

	cookieRecords, err := app.FindRecordsByFilter(
		"user_cookies",
		"user = {:user} && domain = {:domain}",
		"-created",
		10,
		0,
		dbx.Params{"user": userID, "domain": parsedURL.Hostname()},
	)
	if err != nil {
		return "", fmt.Errorf("failed to fetch user cookies: %w", err)
	}

	var cookiesData []string
	for _, record := range cookieRecords {
		cookieData := fmt.Sprintf("%s,%s,%s",
			record.GetString("name"),
			record.GetString("value"),
			record.GetString("domain"),
		)
		cookiesData = append(cookiesData, cookieData)
	}

	cookiesJSON, err := json.Marshal(cookiesData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal cookies to JSON: %w", err)
	}

	return string(cookiesJSON), nil
}
