package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		settings := app.Settings()

		settings.Meta.AppName = "Lynx"
		settings.Meta.HideControls = true

		// Bulk updates use the batch api
		settings.Batch.Enabled = true
		settings.Batch.MaxRequests = 25
		settings.Batch.Timeout = 3

		return app.Save(settings)
	}, nil)
}
