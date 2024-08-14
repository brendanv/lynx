package lynx

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

var parseUrlHandlerFunc = handleParseURL

func InitializePocketbase(app core.App) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.AddRoute(echo.Route{
			Method: http.MethodPost,
			Path:   "/lynx/parse_link",
			Handler: func(c echo.Context) error {
				return parseUrlHandlerFunc(app, c)
			},
			Middlewares: []echo.MiddlewareFunc{
				apis.RequireAdminOrRecordAuth(),
			},
		})

		return nil
	})
}
