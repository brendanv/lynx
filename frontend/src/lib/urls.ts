export default {
  HOME: "/",
  LOGIN: "/login",
  PROFILE: "/profile",
  FEEDS: "/feeds",
  NOTES: "/notes",
  ADD_LINK: "/links/add",
  TAGS: "/tags",
  COOKIES: "/cookies",
  IMPORT: "/import",

  LINK_VIEWER_TEMPLATE: "/link/:id/view",
  LINK_VIEWER: (id: string) => `/link/${id}/view`,
};
