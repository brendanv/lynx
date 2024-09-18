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

		collection, err := dao.FindCollectionByNameOrId("mknopxjk8wle1ae")
		if err != nil {
			return err
		}

		options := map[string]any{}
		if err := json.Unmarshal([]byte(`{
			"query": "-- This table exists to make it easier/faster to query links without loading all content \nSELECT \n  links.id,\n  links.added_to_library,\n  links.user,\n  links.last_viewed_at,\n  links.hostname,\n  links.article_date,\n  links.author,\n  links.title,\n  links.excerpt,\n  links.header_image_url,\n  links.read_time_display,\n  links.tags,\n  links.archive\nFROM links"
		}`), &options); err != nil {
			return err
		}
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("lzaifuwc")

		// remove
		collection.Schema.RemoveField("h39gvqbg")

		// remove
		collection.Schema.RemoveField("oxexvytk")

		// remove
		collection.Schema.RemoveField("ou6kveth")

		// remove
		collection.Schema.RemoveField("xolaoq45")

		// remove
		collection.Schema.RemoveField("xtegukhs")

		// remove
		collection.Schema.RemoveField("klh61d2e")

		// remove
		collection.Schema.RemoveField("tbynl4dl")

		// remove
		collection.Schema.RemoveField("rhdskm1s")

		// remove
		collection.Schema.RemoveField("0af517c9")

		// remove
		collection.Schema.RemoveField("eyjpgmjh")

		// add
		new_added_to_library := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "llqvqxyx",
			"name": "added_to_library",
			"type": "date",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"min": "",
				"max": ""
			}
		}`), new_added_to_library); err != nil {
			return err
		}
		collection.Schema.AddField(new_added_to_library)

		// add
		new_user := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "swy6quh6",
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
		new_last_viewed_at := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "lt2kdbrp",
			"name": "last_viewed_at",
			"type": "date",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": "",
				"max": ""
			}
		}`), new_last_viewed_at); err != nil {
			return err
		}
		collection.Schema.AddField(new_last_viewed_at)

		// add
		new_hostname := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "rufaozv7",
			"name": "hostname",
			"type": "text",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": 500,
				"pattern": ""
			}
		}`), new_hostname); err != nil {
			return err
		}
		collection.Schema.AddField(new_hostname)

		// add
		new_article_date := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "zqkgjotu",
			"name": "article_date",
			"type": "date",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": "",
				"max": ""
			}
		}`), new_article_date); err != nil {
			return err
		}
		collection.Schema.AddField(new_article_date)

		// add
		new_author := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "hognofre",
			"name": "author",
			"type": "text",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_author); err != nil {
			return err
		}
		collection.Schema.AddField(new_author)

		// add
		new_title := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "qfwzt1w4",
			"name": "title",
			"type": "text",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": 500,
				"pattern": ""
			}
		}`), new_title); err != nil {
			return err
		}
		collection.Schema.AddField(new_title)

		// add
		new_excerpt := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "bzzfskyi",
			"name": "excerpt",
			"type": "editor",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"convertUrls": false
			}
		}`), new_excerpt); err != nil {
			return err
		}
		collection.Schema.AddField(new_excerpt)

		// add
		new_header_image_url := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "icibhqnl",
			"name": "header_image_url",
			"type": "url",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"exceptDomains": null,
				"onlyDomains": null
			}
		}`), new_header_image_url); err != nil {
			return err
		}
		collection.Schema.AddField(new_header_image_url)

		// add
		new_read_time_display := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "bmdaqafu",
			"name": "read_time_display",
			"type": "text",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_read_time_display); err != nil {
			return err
		}
		collection.Schema.AddField(new_read_time_display)

		// add
		new_tags := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "dni4gui2",
			"name": "tags",
			"type": "relation",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "u3528zyzzxxe55f",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": null
			}
		}`), new_tags); err != nil {
			return err
		}
		collection.Schema.AddField(new_tags)

		// add
		new_archive := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "lfrhdt5d",
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
		}`), new_archive); err != nil {
			return err
		}
		collection.Schema.AddField(new_archive)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("mknopxjk8wle1ae")
		if err != nil {
			return err
		}

		options := map[string]any{}
		if err := json.Unmarshal([]byte(`{
			"query": "-- This table exists to make it easier/faster to query links without loading all content \nSELECT \n  links.id,\n  links.added_to_library,\n  links.user,\n  links.last_viewed_at,\n  links.hostname,\n  links.article_date,\n  links.author,\n  links.title,\n  links.excerpt,\n  links.header_image_url,\n  links.read_time_display,\n  links.tags\nFROM links"
		}`), &options); err != nil {
			return err
		}
		collection.SetOptions(options)

		// add
		del_added_to_library := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "lzaifuwc",
			"name": "added_to_library",
			"type": "date",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"min": "",
				"max": ""
			}
		}`), del_added_to_library); err != nil {
			return err
		}
		collection.Schema.AddField(del_added_to_library)

		// add
		del_user := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "h39gvqbg",
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
		del_last_viewed_at := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "oxexvytk",
			"name": "last_viewed_at",
			"type": "date",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": "",
				"max": ""
			}
		}`), del_last_viewed_at); err != nil {
			return err
		}
		collection.Schema.AddField(del_last_viewed_at)

		// add
		del_hostname := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "ou6kveth",
			"name": "hostname",
			"type": "text",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": 500,
				"pattern": ""
			}
		}`), del_hostname); err != nil {
			return err
		}
		collection.Schema.AddField(del_hostname)

		// add
		del_article_date := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "xolaoq45",
			"name": "article_date",
			"type": "date",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": "",
				"max": ""
			}
		}`), del_article_date); err != nil {
			return err
		}
		collection.Schema.AddField(del_article_date)

		// add
		del_author := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "xtegukhs",
			"name": "author",
			"type": "text",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_author); err != nil {
			return err
		}
		collection.Schema.AddField(del_author)

		// add
		del_title := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "klh61d2e",
			"name": "title",
			"type": "text",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": 500,
				"pattern": ""
			}
		}`), del_title); err != nil {
			return err
		}
		collection.Schema.AddField(del_title)

		// add
		del_excerpt := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "tbynl4dl",
			"name": "excerpt",
			"type": "editor",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"convertUrls": false
			}
		}`), del_excerpt); err != nil {
			return err
		}
		collection.Schema.AddField(del_excerpt)

		// add
		del_header_image_url := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "rhdskm1s",
			"name": "header_image_url",
			"type": "url",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"exceptDomains": null,
				"onlyDomains": null
			}
		}`), del_header_image_url); err != nil {
			return err
		}
		collection.Schema.AddField(del_header_image_url)

		// add
		del_read_time_display := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "0af517c9",
			"name": "read_time_display",
			"type": "text",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_read_time_display); err != nil {
			return err
		}
		collection.Schema.AddField(del_read_time_display)

		// add
		del_tags := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "eyjpgmjh",
			"name": "tags",
			"type": "relation",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "u3528zyzzxxe55f",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": null
			}
		}`), del_tags); err != nil {
			return err
		}
		collection.Schema.AddField(del_tags)

		// remove
		collection.Schema.RemoveField("llqvqxyx")

		// remove
		collection.Schema.RemoveField("swy6quh6")

		// remove
		collection.Schema.RemoveField("lt2kdbrp")

		// remove
		collection.Schema.RemoveField("rufaozv7")

		// remove
		collection.Schema.RemoveField("zqkgjotu")

		// remove
		collection.Schema.RemoveField("hognofre")

		// remove
		collection.Schema.RemoveField("qfwzt1w4")

		// remove
		collection.Schema.RemoveField("bzzfskyi")

		// remove
		collection.Schema.RemoveField("icibhqnl")

		// remove
		collection.Schema.RemoveField("bmdaqafu")

		// remove
		collection.Schema.RemoveField("dni4gui2")

		// remove
		collection.Schema.RemoveField("lfrhdt5d")

		return dao.SaveCollection(collection)
	})
}
