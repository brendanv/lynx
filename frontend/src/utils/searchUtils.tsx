export type ReadState = "unread" | "read" | "all";
export type HighlightState = "has_highlights" | "no_highlights" | "all";
export type StarredState = "is_starred" | "not_starred" | "all";
export type SortBy = "added_to_library" | "article_date";

export const getReadState = (value: string | null | undefined): ReadState => {
  switch (value) {
    case "unread":
    case "read":
      return value;
    default:
      return "all";
  }
};

export const getHighlightState = (
  value: string | null | undefined,
): HighlightState => {
  switch (value) {
    case "has_highlights":
    case "no_highlights":
      return value;
    default:
      return "all";
  }
};

export const getStarredState = (
  value: string | null | undefined,
): StarredState => {
  switch (value) {
    case "is_starred":
    case "not_starred":
      return value;
    default:
      return "all";
  }
};

export const getSortBy = (value: string | null | undefined): SortBy => {
  switch (value) {
    case "article_date":
      return value;
    default:
      return "added_to_library";
  }
};
