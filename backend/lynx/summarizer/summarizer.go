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

	summarizationModel := userSettings.GetString("summarize_model")
	if summarizationModel == "" {
		logger.Info("Summarization skipped, summarization model not set for user", "userID", userID)
		return
	}

	apiKey := userSettings.GetString("openrouter_api_key")
	if apiKey == "" {
		logger.Error("Summarization failed, OpenRouter API key not set for user", "userID", userID)
		return
	}

	summarizer := NewOpenRouterSummarizer()
	summary, err := summarizer.SummarizeText(link.GetString("raw_text_content"), apiKey, summarizationModel)

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
