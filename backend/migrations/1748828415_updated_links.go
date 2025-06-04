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
		if err := collection.Fields.AddMarshaledJSONAt(19, []byte(`{
			"cascadeDelete": false,
			"collectionId": "u3528zyzzxxe55f",
			"hidden": false,
			"id": "relation2917250194",
			"maxSelect": 2147483647,
			"minSelect": 0,
			"name": "suggested_tags",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "relation"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(24, []byte(`{
			"hidden": false,
			"id": "date2213106044",
			"max": "",
			"min": "",
			"name": "tags_suggested_at",
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
		collection.Fields.RemoveById("relation2917250194")

		// remove field
		collection.Fields.RemoveById("date2213106044")

		return app.Save(collection)
	})
}
