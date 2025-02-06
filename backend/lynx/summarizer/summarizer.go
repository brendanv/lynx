package summarizer

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

func MaybeSummarizeLink(app core.App, linkID string) {
	logger := app.Logger().With("action", "summarizeLink", "linkID", linkID)

	link, err := app.FindRecordById("links", linkID)
	if err != nil {
		logger.Error("Summarization failed, failed to find link", "error", err)
		return
	}

	if link.GetString("summary") != "" {
		logger.Info("Summarization skipped, link already has a summary")
		return
	}

	userID := link.GetString("user")
	userSettings, err := app.FindFirstRecordByFilter("user_settings", "user = {:user}",
		dbx.Params{
			"user": userID,
		})
	if err != nil {
		logger.Info("Summarization skipped, user_settings not found", "userID", userID)
		return
	}

	if !userSettings.GetBool("automatically_summarize_new_links") {
		logger.Info("Summarization skipped, Automatic summarization is disabled for user", "userID", userID)
		return
	}

	summarizationModel := userSettings.GetString("summarization_model")
	if summarizationModel == "" {
		logger.Info("Summarization skipped, summarization model not set for user", "userID", userID)
		return
	}

	var summary string
	var apiKey string

	switch summarizationModel {
	case string(GPT4o), string(GPT4Mini):
		apiKey = userSettings.GetString("openai_api_key")
		if apiKey == "" {
			logger.Error("Summarization failed, OpenAI API key not set for user", "userID", userID)
			return
		}

		summarizer := NewOpenAISummarizer()
		summary, err = summarizer.SummarizeText(link.GetString("raw_text_content"), apiKey, OpenAIModel(summarizationModel))

	case string(Claude3Opus), string(Claude3Sonnet), string(Claude3Haiku):
		apiKey = userSettings.GetString("anthropic_api_key")
		if apiKey == "" {
			logger.Error("Summarization failed, Anthropic API key not set for user", "userID", userID)
			return
		}

		summarizer := NewAnthropicSummarizer()
		summary, err = summarizer.SummarizeText(link.GetString("raw_text_content"), apiKey, AnthropicModel(summarizationModel))

	default:
		logger.Error("Summarization failed, Unsupported summarization model", "model", summarizationModel)
		return
	}

	if err != nil {
		logger.Error("Summarization failed", "error", err)
		return
	}

	err = app.RunInTransaction(func(txApp core.App) error {
		updatedLink, err := txApp.FindRecordById("links", linkID)
		if err != nil {
			return err
		}

		updatedLink.Set("summary", summary)
		if err := txApp.Save(updatedLink); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		logger.Error("Summarization failed, failed to update link", "error", err)
		return
	}

	logger.Info("Successfully summarized link", "model", summarizationModel)
}
