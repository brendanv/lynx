export default {
  HOME: "/",
  HOME_WITH_SEARCH_STRING: (search: string) => `/?s=${search}`,
  HOME_WITH_TAGS_SEARCH: (tagId: string) => `/?t=${tagId}`,
  LOGIN: "/login",
  SETTINGS: "/settings",
  FEEDS: "/settings/feeds",
  NOTES: "/notes",
  ADD_LINK: "/links/add",
  TAGS: "/settings/tags",
  COOKIES: "/settings/cookies",
  IMPORT: "/import",
  API_KEYS: "/settings/api_keys",

  LINK_VIEWER_TEMPLATE: "/link/:id/view",
  LINK_VIEWER: (id: string) => `/link/${id}/view`,

  FEED_ITEMS_TEMPLATE: "/feed/:id/items",
  FEED_ITEMS: (id: string) => `/feed/${id}/items`,
};
