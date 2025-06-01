package summarizer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const DefaultOpenRouterAPIURL = "https://openrouter.ai/api/v1/chat/completions"

type OpenRouterSummarizer struct {
	APIURL string
}

func NewOpenRouterSummarizer() *OpenRouterSummarizer {
	return &OpenRouterSummarizer{APIURL: DefaultOpenRouterAPIURL}
}

func (s *OpenRouterSummarizer) SetAPIURL(url string) {
	s.APIURL = url
}

func (s *OpenRouterSummarizer) SummarizeText(text string, apiKey string, model string) (string, error) {
	if text == "" {
		return "", fmt.Errorf("empty input text")
	}

	payload := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are a helpful assistant that summarizes articles. Provide a concise summary that captures the main points and key insights.",
			},
			{
				"role":    "user",
				"content": fmt.Sprintf("Please summarize the following text:\n\n%s", text),
			},
		},
		"max_tokens": 500,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request payload: %w", err)
	}

	req, err := http.NewRequest("POST", s.APIURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("X-Title", "Lynx")
	req.Header.Set("HTTP-Referer", "https://github.com/brendanv/lynx")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to unmarshal response: %w", err)
	}

	choices, ok := result["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	choice, ok := choices[0].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("invalid choice format")
	}

	message, ok := choice["message"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("invalid message format")
	}

	content, ok := message["content"].(string)
	if !ok {
		return "", fmt.Errorf("invalid content format")
	}

	return content, nil
}
