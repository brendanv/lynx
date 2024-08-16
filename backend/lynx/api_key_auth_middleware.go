package lynx

import (
  "time"

  "github.com/labstack/echo/v5"
  "github.com/pocketbase/dbx"
  "github.com/pocketbase/pocketbase/apis"
  "github.com/pocketbase/pocketbase/core"
)

func ApiKeyAuthMiddleware(app core.App) echo.MiddlewareFunc {
  return func(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
      apiKey := c.Request().Header.Get("X-API-KEY")
      if apiKey == "" {
        return next(c)
      }

      apiKeyRecord, err := app.Dao().FindFirstRecordByFilter(
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
      user, err := app.Dao().FindRecordById("users", userId)
      if err != nil {
        return apis.NewUnauthorizedError("Invalid or expired API key", nil)
      }

      apiKeyRecord.Set("last_used_at", time.Now().UTC())
      if err := app.Dao().SaveRecord(apiKeyRecord); err != nil {
        app.Logger().Error("Failed to update API key last used timestamp", "error", err)
      }

      c.Set(apis.ContextAuthRecordKey, user)

      return next(c)
    }
  }
}