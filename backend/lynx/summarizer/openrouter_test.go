package summarizer

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOpenRouterSummarizeText(t *testing.T) {
	testCases := []struct {
		name            string
		text            string
		apiKey          string
		model           string
		serverResponse  interface{}
		statusCode      int
		expectedError   string
		expectedSummary string
	}{
		{
			name:   "Successful summarization",
			text:   "This is a long text that needs to be summarized.",
			apiKey: "test_api_key",
			model:  "anthropic/claude-3-sonnet",
			serverResponse: map[string]interface{}{
				"choices": []map[string]interface{}{
					{
						"message": map[string]string{
							"content": "This is a summary of the text.",
						},
					},
				},
			},
			statusCode:      http.StatusOK,
			expectedSummary: "This is a summary of the text.",
		},
		{
			name:   "Successful summarization with a different model",
			text:   "This is a long text that needs to be summarized with a different model.",
			apiKey: "test_api_key",
			model:  "openai/gpt-4o",
			serverResponse: map[string]interface{}{
				"choices": []map[string]interface{}{
					{
						"message": map[string]string{
							"content": "This is a summary of the text.",
						},
					},
				},
			},
			statusCode:      http.StatusOK,
			expectedSummary: "This is a summary of the text.",
		},
		{
			name:          "Empty input text",
			text:          "",
			apiKey:        "test_api_key",
			model:         "anthropic/claude-3-sonnet",
			expectedError: "empty input text",
		},
		{
			name:           "API error",
			text:           "Some text",
			apiKey:         "invalid_api_key",
			model:          "anthropic/claude-3-sonnet",
			serverResponse: map[string]string{"error": "Invalid API key"},
			statusCode:     http.StatusUnauthorized,
			expectedError:  "API request failed with status 401",
		},
		{
			name:           "No choices in response",
			text:           "Some text",
			apiKey:         "test_api_key",
			model:          "anthropic/claude-3-sonnet",
			serverResponse: map[string]interface{}{"choices": []interface{}{}},
			statusCode:     http.StatusOK,
			expectedError:  "no choices in response",
		},
		{
			name:           "Invalid choice format",
			text:           "Some text",
			apiKey:         "test_api_key",
			model:          "anthropic/claude-3-sonnet",
			serverResponse: map[string]interface{}{
				"choices": []interface{}{"invalid"},
			},
			statusCode:    http.StatusOK,
			expectedError: "invalid choice format",
		},
		{
			name:   "Invalid message format",
			text:   "Some text",
			apiKey: "test_api_key",
			model:  "anthropic/claude-3-sonnet",
			serverResponse: map[string]interface{}{
				"choices": []map[string]interface{}{
					{
						"message": "invalid",
					},
				},
			},
			statusCode:    http.StatusOK,
			expectedError: "invalid message format",
		},
		{
			name:   "Invalid content format",
			text:   "Some text",
			apiKey: "test_api_key",
			model:  "anthropic/claude-3-sonnet",
			serverResponse: map[string]interface{}{
				"choices": []map[string]interface{}{
					{
						"message": map[string]interface{}{
							"content": 123,
						},
					},
				},
			},
			statusCode:    http.StatusOK,
			expectedError: "invalid content format",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, http.MethodPost, r.Method)
				assert.Equal(t, "application/json", r.Header.Get("Content-Type"))
				assert.Equal(t, "Bearer "+tc.apiKey, r.Header.Get("Authorization"))

				var requestBody map[string]interface{}
				err := json.NewDecoder(r.Body).Decode(&requestBody)
				require.NoError(t, err)

				assert.Equal(t, tc.model, requestBody["model"])
				assert.Equal(t, float64(500), requestBody["max_tokens"])

				messages, ok := requestBody["messages"].([]interface{})
				require.True(t, ok)
				require.Len(t, messages, 2)

				systemMessage, ok := messages[0].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "system", systemMessage["role"])
				assert.Equal(t, "You are a helpful assistant that summarizes articles. Provide a concise summary that captures the main points and key insights.", systemMessage["content"])

				userMessage, ok := messages[1].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "user", userMessage["role"])
				assert.Contains(t, userMessage["content"], tc.text)

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.statusCode)
				json.NewEncoder(w).Encode(tc.serverResponse)
			}))
			defer server.Close()

			summarizer := NewOpenRouterSummarizer()
			summarizer.SetAPIURL(server.URL)

			summary, err := summarizer.SummarizeText(tc.text, tc.apiKey, tc.model)

			if tc.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tc.expectedError)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expectedSummary, summary)
			}
		})
	}
}

func TestOpenRouterSetAPIURL(t *testing.T) {
	summarizer := NewOpenRouterSummarizer()
	newURL := "https://new-api-url.com"
	summarizer.SetAPIURL(newURL)
	assert.Equal(t, newURL, summarizer.APIURL)
}
