package tagger

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func MaybeSuggestTagsForLink(app core.App, linkID string) {
	logger := app.Logger().With("action", "suggestTags", "linkID", linkID)

	link, err := app.FindRecordById("links", linkID)
	if err != nil {
		logger.Error("Tag suggestion failed, failed to find link", "error", err)
		return
	}

	// Check if tags_suggested_at is already set
	if !link.GetDateTime("tags_suggested_at").IsZero() {
		logger.Info("Tag suggestion skipped, suggestions have already been generated")
		return
	}

	userID := link.GetString("user")
	userSettings, err := app.FindFirstRecordByFilter("user_settings", "user = {:user}",
		dbx.Params{
			"user": userID,
		})
	if err != nil {
		logger.Info("Tag suggestion skipped, user_settings not found", "userID", userID)
		return
	}

	if !userSettings.GetBool("automatically_suggest_tags_for_new_links") {
		logger.Info("Tag suggestion skipped, automatic tag suggestion is disabled for user", "userID", userID)
		return
	}

	taggingModel := "openai/gpt-4o-mini"
	apiKey := userSettings.GetString("openrouter_api_key")
	if apiKey == "" {
		logger.Error("Tag suggestion failed, OpenRouter API key not set for user", "userID", userID)
		return
	}

	// Fetch existing tags for the user
	tagRecords, err := app.FindRecordsByFilter("tags", "user = {:user}", "-created", 0, 0,
		dbx.Params{
			"user": userID,
		})
	if err != nil {
		logger.Error("Tag suggestion failed, failed to fetch existing tags", "error", err)
		return
	}

	var existingTags []string
	tagNameToID := make(map[string]string)
	for _, tagRecord := range tagRecords {
		tagName := tagRecord.GetString("name")
		existingTags = append(existingTags, tagName)
		tagNameToID[tagName] = tagRecord.Id
	}

	if len(existingTags) == 0 {
		logger.Info("Tag suggestion skipped, user has no existing tags")
		// Even if no tags are suggested because the user has none, we should mark that we've processed it.
		err = app.RunInTransaction(func(txApp core.App) error {
			updatedLink, err := txApp.FindRecordById("links", linkID)
			if err != nil {
				return err
			}
			updatedLink.Set("tags_suggested_at", types.NowDateTime())
			if err := txApp.Save(updatedLink); err != nil {
				return err
			}
			return nil
		})
		if err != nil {
			logger.Error("Tag suggestion failed, failed to update link's tags_suggested_at after no existing tags", "error", err)
		}
		return
	}

	tagger := NewOpenRouterTagger()
	suggestedTags, err := tagger.SuggestTags(link.GetString("raw_text_content"), existingTags, apiKey, taggingModel)

	if err != nil {
		logger.Error("Tag suggestion failed due to API error", "error", err)
		return
	}

	err = app.RunInTransaction(func(txApp core.App) error {
		updatedLink, err := txApp.FindRecordById("links", linkID)
		if err != nil {
			return err
		}

		if len(suggestedTags) > 0 {
			// Map suggested tag names to tag IDs
			var suggestedTagIDs []string
			for _, tagName := range suggestedTags {
				if tagID, exists := tagNameToID[tagName]; exists {
					suggestedTagIDs = append(suggestedTagIDs, tagID)
				}
			}
			updatedLink.Set("suggested_tags", suggestedTagIDs)
		}
		updatedLink.Set("tags_suggested_at", types.NowDateTime())

		if err := txApp.Save(updatedLink); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		logger.Error("Tag suggestion failed, failed to update link", "error", err)
		return
	}

	if len(suggestedTags) == 0 {
		logger.Info("No tags suggested for link, tags_suggested_at updated.")
	} else {
		logger.Info("Successfully suggested tags for link", "model", taggingModel, "suggestedCount", len(suggestedTags))
	}
}
