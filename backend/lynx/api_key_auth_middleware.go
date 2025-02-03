package lynx

import (
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/hook"
)

func ApiKeyAuthMiddleware(app core.App) *hook.Handler[*core.RequestEvent] {
	return &hook.Handler[*core.RequestEvent]{
		Id: "lynxApiKeyAuth",
		Func: func(e *core.RequestEvent) error {
			apiKey := e.Request.Header.Get("X-API-KEY")
			if apiKey == "" {
				return e.Next()
			}

			apiKeyRecord, err := app.FindFirstRecordByFilter(
				"api_keys",
				"api_key = {:key} && expires_at > {:now}",
				dbx.Params{
					"key": apiKey,
					"now": time.Now().UTC().Format(time.RFC3339),
				},
			)

			if err != nil {
				return apis.NewUnauthorizedError("Invalid or expired API key", nil)
			}

			userId := apiKeyRecord.GetString("user")
			user, err := app.FindRecordById("users", userId)
			if err != nil {
				return apis.NewUnauthorizedError("Invalid or expired API key", nil)
			}

			apiKeyRecord.Set("last_used_at", time.Now().UTC())
			if err := app.Save(apiKeyRecord); err != nil {
				app.Logger().Error("Failed to update API key last used timestamp", "error", err)
			}

			e.Auth = user

			return e.Next()
		},
	}
}
