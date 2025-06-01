package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("ra9onkcvy8isipe")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("ag0wlcbb")

		// remove field
		collection.Fields.RemoveById("lmyn1tkq")

		// remove field
		collection.Fields.RemoveById("0ykppjhp")

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(4, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text3393930114",
			"max": 512,
			"min": 0,
			"name": "summarize_model",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("ra9onkcvy8isipe")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(3, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "ag0wlcbb",
			"max": 500,
			"min": 0,
			"name": "openai_api_key",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(4, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "lmyn1tkq",
			"max": 500,
			"min": 0,
			"name": "anthropic_api_key",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(8, []byte(`{
			"hidden": false,
			"id": "0ykppjhp",
			"maxSelect": 1,
			"name": "summarization_model",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "select",
			"values": [
				"gpt-4o-mini",
				"gpt-4o",
				"claude-3-haiku-20240307",
				"claude-3-5-sonnet-20240620",
				"claude-3-opus-20240229"
			]
		}`)); err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("text3393930114")

		return app.Save(collection)
	})
}
