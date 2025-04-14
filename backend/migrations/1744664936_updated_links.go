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

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(20, []byte(`{
			"hidden": false,
			"id": "k21u2gru",
			"maxSelect": 1,
			"maxSize": 20971520,
			"mimeTypes": [
				"text/html"
			],
			"name": "archive",
			"presentable": false,
			"protected": false,
			"required": false,
			"system": false,
			"thumbs": null,
			"type": "file"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("0mucz6opmdvkaqc")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(20, []byte(`{
			"hidden": false,
			"id": "k21u2gru",
			"maxSelect": 1,
			"maxSize": 10485760,
			"mimeTypes": [
				"text/html"
			],
			"name": "archive",
			"presentable": false,
			"protected": false,
			"required": false,
			"system": false,
			"thumbs": null,
			"type": "file"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
