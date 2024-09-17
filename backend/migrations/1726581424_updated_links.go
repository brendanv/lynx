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
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("0mucz6opmdvkaqc")
		if err != nil {
			return err
		}

		if err := json.Unmarshal([]byte(`[
			"CREATE INDEX ` + "`" + `idx_JTJGgLG` + "`" + ` ON ` + "`" + `links` + "`" + ` (\n  ` + "`" + `user` + "`" + `,\n  ` + "`" + `added_to_library` + "`" + `\n)",
			"CREATE INDEX ` + "`" + `idx_q2rhPt0` + "`" + ` ON ` + "`" + `links` + "`" + ` (\n  ` + "`" + `user` + "`" + `,\n  ` + "`" + `tags` + "`" + `,\n  ` + "`" + `added_to_library` + "`" + `\n)",
			"CREATE INDEX ` + "`" + `idx_eCmCUry` + "`" + ` ON ` + "`" + `links` + "`" + ` (\n  ` + "`" + `user` + "`" + `,\n  ` + "`" + `last_viewed_at` + "`" + `,\n  ` + "`" + `added_to_library` + "`" + `\n)"
		]`), &collection.Indexes); err != nil {
			return err
		}

		// update
		edit_archive := &schema.SchemaField{}
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
				"maxSize": 10485760,
				"protected": false
			}
		}`), edit_archive); err != nil {
			return err
		}
		collection.Schema.AddField(edit_archive)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("0mucz6opmdvkaqc")
		if err != nil {
			return err
		}

		if err := json.Unmarshal([]byte(`[]`), &collection.Indexes); err != nil {
			return err
		}

		// update
		edit_archive := &schema.SchemaField{}
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
		}`), edit_archive); err != nil {
			return err
		}
		collection.Schema.AddField(edit_archive)

		return dao.SaveCollection(collection)
	})
}
