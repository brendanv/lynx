package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("0mucz6opmdvkaqc")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(22, []byte(`{
			"hidden": false,
			"id": "date3676248062",
			"max": "",
			"min": "",
			"name": "starred_at",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "date"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("0mucz6opmdvkaqc")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("date3676248062")

		return app.Save(collection)
	})
}
