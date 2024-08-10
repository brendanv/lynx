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
			"id": "ra9onkcvy8isipe",
			"created": "2024-08-10 12:45:23.299Z",
			"updated": "2024-08-10 12:45:23.299Z",
			"name": "user_settings",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "jjjon8kt",
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
					"id": "ag0wlcbb",
					"name": "openai_api_key",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": 500,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "lmyn1tkq",
					"name": "anthropic_api_key",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": 500,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "s2cvcnhn",
					"name": "automatically_summarize_new_links",
					"type": "bool",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "tyqfzhfo",
					"name": "headers_for_scraping",
					"type": "json",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"maxSize": 2000000
					}
				},
				{
					"system": false,
					"id": "8zcln2sz",
					"name": "headers_updated_at",
					"type": "date",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": "",
						"max": ""
					}
				},
				{
					"system": false,
					"id": "0ykppjhp",
					"name": "summarization_model",
					"type": "select",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"maxSelect": 1,
						"values": [
							"gpt-4o-mini",
							"gpt-4o",
							"claude-3-haiku-20240307",
							"claude-3-5-sonnet-20240620",
							"claude-3-opus-20240229"
						]
					}
				}
			],
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_yWfNbjY` + "`" + ` ON ` + "`" + `user_settings` + "`" + ` (` + "`" + `user` + "`" + `)"
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

		collection, err := dao.FindCollectionByNameOrId("ra9onkcvy8isipe")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
