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

		collection, err := dao.FindCollectionByNameOrId("uxyi2qblr5y376o")
		if err != nil {
			return err
		}

		if err := json.Unmarshal([]byte(`[
			"CREATE INDEX ` + "`" + `idx_mimat6g` + "`" + ` ON ` + "`" + `highlights` + "`" + ` (\n  ` + "`" + `user` + "`" + `,\n  ` + "`" + `created` + "`" + `\n)",
			"CREATE INDEX ` + "`" + `idx_5cL1sT9` + "`" + ` ON ` + "`" + `highlights` + "`" + ` (\n  ` + "`" + `user` + "`" + `,\n  ` + "`" + `link` + "`" + `\n)"
		]`), &collection.Indexes); err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("xzh2pcyt")

		// remove
		collection.Schema.RemoveField("88mhugxs")

		// add
		new_serialized_range := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "iftddbtd",
			"name": "serialized_range",
			"type": "text",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_serialized_range); err != nil {
			return err
		}
		collection.Schema.AddField(new_serialized_range)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("uxyi2qblr5y376o")
		if err != nil {
			return err
		}

		if err := json.Unmarshal([]byte(`[
			"CREATE INDEX ` + "`" + `idx_6aZYAfG` + "`" + ` ON ` + "`" + `highlights` + "`" + ` (\n  ` + "`" + `link` + "`" + `,\n  ` + "`" + `start_index` + "`" + `\n)",
			"CREATE INDEX ` + "`" + `idx_mimat6g` + "`" + ` ON ` + "`" + `highlights` + "`" + ` (\n  ` + "`" + `user` + "`" + `,\n  ` + "`" + `created` + "`" + `\n)"
		]`), &collection.Indexes); err != nil {
			return err
		}

		// add
		del_start_index := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "xzh2pcyt",
			"name": "start_index",
			"type": "number",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": 0,
				"max": null,
				"noDecimal": true
			}
		}`), del_start_index); err != nil {
			return err
		}
		collection.Schema.AddField(del_start_index)

		// add
		del_end_index := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "88mhugxs",
			"name": "end_index",
			"type": "number",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"noDecimal": false
			}
		}`), del_end_index); err != nil {
			return err
		}
		collection.Schema.AddField(del_end_index)

		// remove
		collection.Schema.RemoveField("iftddbtd")

		return dao.SaveCollection(collection)
	})
}
