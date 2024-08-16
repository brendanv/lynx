export default {
  HOME: "/",
  LOGIN: "/login",
  PROFILE: "/profile",
  FEEDS: "/feeds",
  NOTES: "/notes",
  ADD_LINK: "/links/add",
  TAGS: "/tags",
  COOKIES: "/profile/cookies",
  IMPORT: "/import",
  API_KEYS: "/profile/api_keys",

  LINK_VIEWER_TEMPLATE: "/link/:id/view",
  LINK_VIEWER: (id: string) => `/link/${id}/view`,
};
