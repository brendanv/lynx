export default {
  HOME: "/",
  HOME_WITH_SEARCH_STRING: (search: string) => `/?s=${search}`,
  HOME_WITH_TAGS_SEARCH: (tagId: string) => `/?t=${tagId}`,
  HOME_WITH_FEED_SEARCH: (feedId: string) => `/?f=${feedId}`,
  HOME_WITH_UNREAD_LINKS: "/?r=unread",
  FAVORITES: "/?st=is_starred",
  LOGIN: "/login",
  FEEDS: "/settings/feeds",
  HIGHLIGHTS: "/highlights",
  HIGHLIGHTS_WITH_LINK_SEARCH: (linkId: string) => `/highlights/?l=${linkId}`,
  HIGHLIGHTS_WITH_TAG_SEARCH: (tagId: string) => `/highlights/?t=${tagId}`,
  ADD_LINK: "/links/add",

  SETTINGS_TEMPLATE: "/settings/:tabValue",
  SETTINGS: "/settings/general",
  TAGS: "/settings/tags",
  COOKIES: "/settings/cookies",
  IMPORT: "/settings/import",
  API_KEYS: "/settings/api_keys",

  LINK_VIEWER_TEMPLATE: "/link/:id/view",
  LINK_VIEWER: (id: string) => `/link/${id}/view`,

  EDIT_LINK_TEMPLATE: "/link/:id/edit",
  EDIT_LINK: (id: string) => `/link/${id}/edit`,

  FEED_ITEMS_TEMPLATE: "/feed/:id/items",
  FEED_ITEMS: (id: string) => `/feed/${id}/items`,

  LINK_ARCHIVE_TEMPLATE: "/link/:id/archive",
  LINK_ARCHIVE: (id: string) => `/link/${id}/archive`,
};
