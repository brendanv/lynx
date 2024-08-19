package summarizer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type AnthropicModel string

const (
	Claude3Opus   AnthropicModel = "claude-3-opus-20240229"
	Claude3Sonnet AnthropicModel = "claude-3-5-sonnet-20240620"
	Claude3Haiku  AnthropicModel = "claude-3-haiku-20240307"
)

const DefaultAnthropicAPIURL = "https://api.anthropic.com/v1/messages"

type AnthropicSummarizer struct {
	APIURL string
}

func NewAnthropicSummarizer() *AnthropicSummarizer {
	return &AnthropicSummarizer{APIURL: DefaultAnthropicAPIURL}
}
func (s *AnthropicSummarizer) SetAPIURL(url string) {
	s.APIURL = url
}

const AnthropicAPIURL = "https://api.anthropic.com/v1/messages"

func (s *AnthropicSummarizer) SummarizeText(text string, apiKey string, model AnthropicModel) (string, error) {
	if text == "" {
		return "", fmt.Errorf("empty input text")
	}

	payload := map[string]interface{}{
		"model": string(model),
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": fmt.Sprintf("Please summarize the following text:\n\n%s", text),
			},
		},
		"max_tokens": 1000,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("error marshaling JSON: %v", err)
	}

	req, err := http.NewRequest("POST", s.APIURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API request failed with status code %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	err = json.Unmarshal(body, &result)
	if err != nil {
		return "", fmt.Errorf("error parsing JSON response: %v", err)
	}

	content, ok := result["content"].([]interface{})
	if !ok || len(content) == 0 {
		return "", fmt.Errorf("unexpected response format: content not found or empty")
	}

	firstContent, ok := content[0].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected content format: first content item is not an object")
	}

	summary, ok := firstContent["text"].(string)
	if !ok {
		return "", fmt.Errorf("summary not found in response or not a string")
	}

	return summary, nil
}
