package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		jsonData := `{
			"id": "d2k4cqmmpm0mz2j",
			"created": "2024-08-10 12:45:23.298Z",
			"updated": "2024-08-10 12:45:23.298Z",
			"name": "link_archives",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "1zexg5gw",
					"name": "user",
					"type": "relation",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "_pb_users_auth_",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "kzjkra3z",
					"name": "link",
					"type": "relation",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "0mucz6opmdvkaqc",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "brfqxz1v",
					"name": "archive_content",
					"type": "editor",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"convertUrls": false
					}
				}
			],
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_esUPXH8` + "`" + ` ON ` + "`" + `link_archives` + "`" + ` (\n  ` + "`" + `user` + "`" + `,\n  ` + "`" + `link` + "`" + `\n)"
			],
			"listRule": "user = @request.auth.id",
			"viewRule": "user = @request.auth.id",
			"createRule": "user = @request.auth.id",
			"updateRule": "user = @request.auth.id",
			"deleteRule": "user = @request.auth.id",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("d2k4cqmmpm0mz2j")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
