package tagger

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const DefaultOpenRouterAPIURL = "https://openrouter.ai/api/v1/chat/completions"

type OpenRouterTagger struct {
	APIURL string
}

func NewOpenRouterTagger() *OpenRouterTagger {
	return &OpenRouterTagger{
		APIURL: DefaultOpenRouterAPIURL,
	}
}

func (t *OpenRouterTagger) SuggestTags(text string, existingTags []string, apiKey string, model string) ([]string, error) {
	if text == "" {
		return nil, fmt.Errorf("empty input text")
	}

	// Create JSON schema for structured output
	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"suggested_tags": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "string",
				},
				"description": "Array of suggested tag names from the existing tags list",
			},
		},
		"required":             []string{"suggested_tags"},
		"additionalProperties": false,
	}

	// Create the system prompt
	systemPrompt := fmt.Sprintf(`You are a helpful assistant that suggests relevant tags for articles based on their content. 

Given the following article content, suggest up to 5 relevant tags from the user's existing tags list. Only suggest tags that already exist in the list - do not create new tags.
It is ok to suggest an empty list if none of the existing tags are relevant.

Existing tags: %s

Respond with a JSON object containing an array of suggested tag names.`, formatTagsList(existingTags))

	payload := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": systemPrompt,
			},
			{
				"role":    "user",
				"content": text,
			},
		},
		"response_format": map[string]interface{}{
			"type": "json_schema",
			"json_schema": map[string]interface{}{
				"name":   "tag_suggestions",
				"strict": true,
				"schema": schema,
			},
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request payload: %w", err)
	}

	req, err := http.NewRequest("POST", t.APIURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	choices, ok := result["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return nil, fmt.Errorf("no choices in response")
	}

	choice, ok := choices[0].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid choice format")
	}

	message, ok := choice["message"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid message format")
	}

	content, ok := message["content"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid content format")
	}

	var tagResponse struct {
		SuggestedTags []string `json:"suggested_tags"`
	}

	if err := json.Unmarshal([]byte(content), &tagResponse); err != nil {
		return nil, fmt.Errorf("failed to unmarshal tag response: %w", err)
	}

	return tagResponse.SuggestedTags, nil
}

func formatTagsList(tags []string) string {
	if len(tags) == 0 {
		return "No existing tags"
	}

	result := ""
	for i, tag := range tags {
		if i > 0 {
			result += ", "
		}
		result += tag
	}
	return result
}
