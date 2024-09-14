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
			"id": "f97y321xmbylh9y",
			"created": "2024-08-25 02:51:55.659Z",
			"updated": "2024-08-25 02:51:55.659Z",
			"name": "tags_metadata",
			"type": "view",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "gk4n46rz",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 2,
						"max": 50,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "8jvpjiih",
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
					"id": "iygpfkw8",
					"name": "slug",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 2,
						"max": 50,
						"pattern": "^[a-zA-Z0-9_-]+$"
					}
				},
				{
					"system": false,
					"id": "sqbhxlmc",
					"name": "link_count",
					"type": "number",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"noDecimal": false
					}
				}
			],
			"indexes": [],
			"listRule": "user = @request.auth.id",
			"viewRule": "user = @request.auth.id",
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {
				"query": "SELECT\n    t.id,\n    t.name,\n    t.user,\n    t.slug,\n    COUNT(l.id) AS link_count\nFROM\n    tags t\nLEFT JOIN\n    links l ON json_extract(l.tags, '$') LIKE '%' || t.id || '%'\nGROUP BY\n    t.id, t.name, t.user, t.slug"
			}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db)

		collection, err := dao.FindCollectionByNameOrId("f97y321xmbylh9y")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
