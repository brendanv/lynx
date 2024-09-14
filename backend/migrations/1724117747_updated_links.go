package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models/schema"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db)

		collection, err := dao.FindCollectionByNameOrId("0mucz6opmdvkaqc")
		if err != nil {
			return err
		}

		// add
		new_archive := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "k21u2gru",
			"name": "archive",
			"type": "file",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"mimeTypes": [
					"text/html"
				],
				"thumbs": [],
				"maxSelect": 1,
				"maxSize": 1048576,
				"protected": false
			}
		}`), new_archive); err != nil {
			return err
		}
		collection.Schema.AddField(new_archive)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db)

		collection, err := dao.FindCollectionByNameOrId("0mucz6opmdvkaqc")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("k21u2gru")

		return dao.SaveCollection(collection)
	})
}
