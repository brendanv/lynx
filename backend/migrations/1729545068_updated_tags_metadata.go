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

		collection, err := dao.FindCollectionByNameOrId("f97y321xmbylh9y")
		if err != nil {
			return err
		}

		options := map[string]any{}
		if err := json.Unmarshal([]byte(`{
			"query": "WITH link_tags AS (\n  SELECT json_each.value AS tag_id, COUNT(DISTINCT links.id) AS count\n  FROM links, json_each(links.tags)\n  GROUP BY json_each.value\n),\nhighlight_tags AS (\n  SELECT json_each.value AS tag_id, COUNT(DISTINCT highlights.id) AS count\n  FROM highlights, json_each(highlights.tags)\n  GROUP BY json_each.value\n)\nSELECT \n  t.id AS id,\n  t.name AS name,\n  t.user AS user,\n  t.slug AS slug,\n  COALESCE(lt.count, 0) AS link_count,\n  COALESCE(ht.count, 0) AS highlight_count\nFROM tags t\nLEFT JOIN link_tags lt ON t.id = lt.tag_id\nLEFT JOIN highlight_tags ht ON t.id = ht.tag_id\nORDER BY t.name;"
		}`), &options); err != nil {
			return err
		}
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("xmri730z")

		// remove
		collection.Schema.RemoveField("x8kgxrxg")

		// remove
		collection.Schema.RemoveField("pdyfhwbv")

		// remove
		collection.Schema.RemoveField("ujoimra2")

		// add
		new_name := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "ijiajelb",
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
		}`), new_name); err != nil {
			return err
		}
		collection.Schema.AddField(new_name)

		// add
		new_user := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "oduqora0",
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
		}`), new_user); err != nil {
			return err
		}
		collection.Schema.AddField(new_user)

		// add
		new_slug := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "sdwdsrej",
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
		}`), new_slug); err != nil {
			return err
		}
		collection.Schema.AddField(new_slug)

		// add
		new_link_count := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "7krrlepr",
			"name": "link_count",
			"type": "json",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"maxSize": 1
			}
		}`), new_link_count); err != nil {
			return err
		}
		collection.Schema.AddField(new_link_count)

		// add
		new_highlight_count := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "0n6ejigt",
			"name": "highlight_count",
			"type": "json",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"maxSize": 1
			}
		}`), new_highlight_count); err != nil {
			return err
		}
		collection.Schema.AddField(new_highlight_count)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("f97y321xmbylh9y")
		if err != nil {
			return err
		}

		options := map[string]any{}
		if err := json.Unmarshal([]byte(`{
			"query": "SELECT\n    t.id,\n    t.name,\n    t.user,\n    t.slug,\n    COUNT(l.id) AS link_count\nFROM\n    tags t\nLEFT JOIN\n    links l ON json_extract(l.tags, '$') LIKE '%' || t.id || '%'\nGROUP BY\n    t.id, t.name, t.user, t.slug"
		}`), &options); err != nil {
			return err
		}
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "xmri730z",
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
		}`), del_name); err != nil {
			return err
		}
		collection.Schema.AddField(del_name)

		// add
		del_user := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "x8kgxrxg",
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
		}`), del_user); err != nil {
			return err
		}
		collection.Schema.AddField(del_user)

		// add
		del_slug := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "pdyfhwbv",
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
		}`), del_slug); err != nil {
			return err
		}
		collection.Schema.AddField(del_slug)

		// add
		del_link_count := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "ujoimra2",
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
		}`), del_link_count); err != nil {
			return err
		}
		collection.Schema.AddField(del_link_count)

		// remove
		collection.Schema.RemoveField("ijiajelb")

		// remove
		collection.Schema.RemoveField("oduqora0")

		// remove
		collection.Schema.RemoveField("sdwdsrej")

		// remove
		collection.Schema.RemoveField("7krrlepr")

		// remove
		collection.Schema.RemoveField("0n6ejigt")

		return dao.SaveCollection(collection)
	})
}
