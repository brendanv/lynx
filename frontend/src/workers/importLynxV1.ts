import PocketBase from "pocketbase";

let userId: string;

self.onmessage = async (event) => {
  const { jsonData, pocketbaseUrl, userToken, userId: id } = event.data;
  userId = id;
  const pb = new PocketBase(pocketbaseUrl);
  pb.authStore.save(userToken, null);

  const data = JSON.parse(jsonData);

  try {
    await importData(data, pb);
    self.postMessage({ type: "complete" });
  } catch (error: any) {
    self.postMessage({ type: "error", error: error.message });
  }
};

async function importData(data: any, pb: PocketBase) {
  const tagMapping = await importTags(data.Tag, pb);
  const feedMapping = await importFeeds(data.Feed, pb);
  const linkMapping = await importLinks(
    data.Link,
    data.LinkArchive,
    tagMapping,
    feedMapping,
    pb,
  );
  await importFeedItems(data.FeedItem, feedMapping, linkMapping, pb);
}

async function importTags(tags: any[], pb: PocketBase) {
  const tagMapping = new Map();
  let progress = 0;

  for (const tag of tags) {
    try {
      const newTag = await pb
        .collection("tags")
        .create({ user: userId, name: tag.fields.name, slug: tag.fields.slug });
      tagMapping.set(tag.pk, newTag.id);
    } catch (error) {
      console.error(`Failed to import tag ${tag.name}:`, error);
    }
    progress += 100 / tags.length;
    self.postMessage({ type: "progress", category: "tags", progress });
  }

  console.log("Tag mapping: ", tagMapping);
  return tagMapping;
}

async function importFeeds(feeds: any[], pb: PocketBase) {
  const feedMapping = new Map();
  let progress = 0;

  for (const feed of feeds) {
    try {
      if (!feed.fields.is_deleted) {
        const newFeed = await pb.collection("feeds").create({
          user: userId,
          name: feed.fields.feed_name,
          feed_url: feed.fields.feed_url,
          description: feed.fields.feed_description,
          image_url: feed.fields.feed_image_url,
          etag: feed.fields.etag,
          modified: feed.fields.modified,
          last_fetched_at: feed.fields.last_fetched_at,
        });
        feedMapping.set(feed.pk, newFeed.id);
      }
    } catch (error) {
      console.error(`Failed to import feed ${feed.name}:`, error);
    }
    progress += 100 / feeds.length;
    self.postMessage({ type: "progress", category: "feeds", progress });
  }

  console.log("Feed mapping: ", feedMapping);
  return feedMapping;
}

async function importFeedItems(
  feedItems: any[],
  feedMapping: Map<number, string>,
  linkMapping: Map<number, string>,
  pb: PocketBase,
) {
  const feedItemMapping = new Map();
  let progress = 0;

  for (const item of feedItems) {
    try {
      if (!feedMapping.has(item.fields.feed)) {
        throw new Error(`Feed with ID ${item.fields.feed_id} not found`);
      }

      const newItem = await pb.collection("feed_items").create({
        user: userId,
        feed: feedMapping.get(item.fields.feed),
        title: item.fields.title,
        pub_date: item.fields.pub_date,
        guid: item.fields.guid,
        description: item.fields.description,
        url: item.fields.url,
        saved_as_link: linkMapping.get(item.fields.saved_as_link),
      });
      feedItemMapping.set(item.pk, newItem.id);
    } catch (error) {
      console.error(`Failed to import feed item ${item.title}:`, error);
    }
    progress += 100 / feedItems.length;
    self.postMessage({ type: "progress", category: "feedItems", progress });
  }
  console.log("FeedItem mapping: ", feedItemMapping);
}

async function importLinks(
  links: any[],
  linkArchives: any[],
  tagMapping: Map<number, string>,
  feedMapping: Map<number, string>,
  pb: PocketBase,
) {
  const linkMapping = new Map();
  let progress = 0;

  const importDate = new Date().toISOString().split("T")[0];
  const importTag = await pb.collection("tags").create({
    user: userId,
    name: `Import ${importDate}`,
    slug: `import-${importDate}`,
  });

  for (const link of links) {
    try {
      const formData = new FormData();

      const archive = linkArchives.find((a: any) => a.fields.link === link.pk);
      if (archive) {
        const file = new File(
          [archive.fields.archive_content],
          "archive.html",
          { type: "text/html" },
        );
        formData.append("archive", file);
      }

      formData.append("user", userId);
      formData.append("added_to_library", link.fields.added_at);
      formData.append("last_viewed_at", link.fields.last_viewed_at);
      formData.append("original_url", link.fields.original_url);
      formData.append("cleaned_url", link.fields.cleaned_url);
      formData.append("hostname", link.fields.hostname);
      formData.append("article_date", link.fields.article_date);
      formData.append("author", link.fields.author);
      formData.append("title", link.fields.title);
      formData.append("excerpt", link.fields.excerpt);
      formData.append("header_image_url", link.fields.header_image_url);
      formData.append("article_html", link.fields.article_html);
      formData.append("raw_text_content", link.fields.raw_text_content);
      formData.append("full_page_html", link.fields.full_page_html);
      formData.append("summary", link.fields.summary);
      formData.append("read_time_seconds", link.fields.read_time_seconds);
      formData.append("read_time_display", link.fields.read_time_display);

      link.fields.tags.forEach((tag: number) => {
        const mapped = tagMapping.get(tag);
        if (mapped) {
          formData.append("tags", mapped);
        }
      });
      formData.append("tags", importTag.id);

      const createdFromFeed = feedMapping.get(link.fields.created_from_feed);
      if (createdFromFeed) {
        formData.append("created_from_feed", createdFromFeed);
      }

      const newLink = await pb.collection("links").create(formData);
      linkMapping.set(link.pk, newLink.id);
    } catch (error) {
      console.error(`Failed to import link ${link.url}:`, error);
    }
    progress += 100 / links.length;
    self.postMessage({ type: "progress", category: "links", progress });
  }
  console.log(linkMapping);
  return linkMapping;
}
