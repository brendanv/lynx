package lynx

import (
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

var parseUrlHandlerFunc = handleParseURL

func InitializePocketbase(app core.App) {

	apiKeyAuth := ApiKeyAuthMiddleware(app)

	
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.AddRoute(echo.Route{
			Method: http.MethodPost,
			Path:   "/lynx/parse_link",
			Handler: func(c echo.Context) error {
				return parseUrlHandlerFunc(app, c)
			},
			Middlewares: []echo.MiddlewareFunc{
				apiKeyAuth,
				apis.RequireAdminOrRecordAuth(),
			},
		})

		return nil
	})

	// Automatically update last_viewed_at when links are loaded
	// individually. However, let the client control this behavior
	// with a header.
	app.OnRecordViewRequest("links").Add(func(e *core.RecordViewEvent) error {
		updateHeader := e.HttpContext.Request().Header.Get("X-Lynx-Update-Last-Viewed")
		if updateHeader != "true" {
			return nil
		}

		e.Record.Set("last_viewed_at", time.Now().UTC().Format(time.RFC3339))

		err := app.Dao().SaveRecord(e.Record)
		if err != nil {
			log.Printf("Failed to update last_viewed_at: %v", err)
			return err
		}

		return nil
	})
}
