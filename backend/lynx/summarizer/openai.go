package summarizer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type OpenAIModel string

const (
	GPT4o    OpenAIModel = "gpt-4o"
	GPT4Mini OpenAIModel = "gpt-4o-mini"
)

const DefaultOpenAIAPIURL = "https://api.openai.com/v1/chat/completions"

type OpenAISummarizer struct {
	APIURL string
}

func NewOpenAISummarizer() *OpenAISummarizer {
	return &OpenAISummarizer{APIURL: DefaultOpenAIAPIURL}
}

func (s *OpenAISummarizer) SetAPIURL(url string) {
	s.APIURL = url
}

func (s *OpenAISummarizer) SummarizeText(text string, apiKey string, model OpenAIModel) (string, error) {
	if text == "" {
		return "", fmt.Errorf("empty input text")
	}

	payload := map[string]interface{}{
		"model": string(model),
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are a helpful assistant that summarizes text.",
			},
			{
				"role":    "user",
				"content": fmt.Sprintf("Please summarize the following text:\n\n%s", text),
			},
		},
		"max_tokens": 1024,
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
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

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

	choices, ok := result["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return "", fmt.Errorf("unexpected response format: choices not found or empty")
	}

	firstChoice, ok := choices[0].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected choice format: first choice is not an object")
	}

	message, ok := firstChoice["message"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected message format: message is not an object")
	}

	summary, ok := message["content"].(string)
	if !ok {
		return "", fmt.Errorf("summary not found in response or not a string")
	}

	return summary, nil
}
