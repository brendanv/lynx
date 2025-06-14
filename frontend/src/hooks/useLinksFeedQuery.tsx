import { usePocketBase } from "@/hooks/usePocketBase";
import type FeedLink from "@/types/FeedLink";
import { GenericLynxMutator } from "@/types/Mutations";
import type Tag from "@/types/Tag";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import Client, { ListResult } from "pocketbase";
import { notifications } from "@mantine/notifications";
import { useCallback } from "react";
import type {
  ReadState,
  HighlightState,
  StarredState,
  SortBy,
} from "@/utils/searchUtils";

// Works for 2- and 3- column grids
const PAGE_SIZE = 18;

type Props = {
  page?: number;
  readState?: ReadState;
  highlightState?: HighlightState;
  starredState?: StarredState;
  tagId?: string;
  searchText?: string;
  feedId?: string;
  sortBy: SortBy;
};

export type FeedQueryItem = {
  id: string;
  added_to_library: string;
  article_date: string | null;
  author: string | null;
  collectionId: string;
  collectionName: string;
  excerpt: string | null;
  expand?: {
    tags: Tag[];
    created_from_feed?: { id: string; name: string };
    suggested_tags?: Tag[];
  };
  header_image_url: string | null;
  hostname: string | null;
  last_viewed_at: string | null;
  read_time_display: string | null;
  summary: string | null;
  tags: string[];
  suggested_tags?: string[];
  title: string | null;
  user: string;
  archive: string | null;
  reading_progress: number | null;
  starred_at: string | null;
};

// Must be kept in sync with the above
const getFields = () =>
  [
    "id",
    "added_to_library",
    "article_date",
    "author",
    "created_from_feed",
    "excerpt",
    "header_image_url",
    "hostname",
    "last_viewed_at",
    "read_time_display",
    "summary",
    "title",
    "tags",
    "suggested_tags",
    "archive",
    "user",
    "expand.tags.*",
    "expand.created_from_feed.id",
    "expand.created_from_feed.name",
    "expand.suggested_tags.*",
    "reading_progress",
    "starred_at",
  ].join(",");

export const convertFeedQueryItemToFeedLink = (
  item: FeedQueryItem,
): FeedLink => {
  return {
    id: item.id,
    added_to_library: new Date(item.added_to_library),
    article_date: item.article_date ? new Date(item.article_date) : null,
    author: item.author,
    excerpt: item.excerpt,
    header_image_url: item.header_image_url,
    hostname: item.hostname,
    last_viewed_at: item.last_viewed_at ? new Date(item.last_viewed_at) : null,
    read_time_display: item.read_time_display,
    summary: item.summary,
    title: item.title,
    tags:
      item.expand && item.expand.tags
        ? item.expand.tags.map(({ id, name, slug }) => ({
            id,
            name,
            slug,
          }))
        : [],
    suggested_tags:
      item.expand && item.expand.suggested_tags
        ? item.expand.suggested_tags.map(({ id, name, slug }) => ({
            id,
            name,
            slug,
          }))
        : [],
    feed:
      item.expand && item.expand.created_from_feed
        ? {
            id: item.expand.created_from_feed.id,
            name: item.expand.created_from_feed.name,
          }
        : undefined,
    archive: item.archive,
    reading_progress: item.reading_progress,
    starred_at: item.starred_at ? new Date(item.starred_at) : null,
  };
};

const buildFilters = (client: Client, props: Props) => {
  const { readState, tagId, searchText, feedId, highlightState, starredState } =
    props;
  const filterExprs: string[] = [];

  if (readState === "unread") {
    filterExprs.push(client.filter("last_viewed_at = null"));
  } else if (readState === "read") {
    filterExprs.push(client.filter("last_viewed_at != null"));
  }

  if (tagId) {
    filterExprs.push(
      client.filter("(tags.id ?= {:tagId} || suggested_tags.id ?= {:tagId})", {
        tagId,
      }),
    );
  }

  if (searchText) {
    filterExprs.push(
      client.filter("(title ~ {:search} || excerpt ~ {:search})", {
        search: searchText,
      }),
    );
  }

  if (feedId) {
    filterExprs.push(
      client.filter("created_from_feed.id ?= {:feedId}", { feedId }),
    );
  }

  if (highlightState === "has_highlights") {
    filterExprs.push(client.filter("highlights_via_link.id != null"));
  } else if (highlightState === "no_highlights") {
    filterExprs.push(client.filter("highlights_via_link.id = null"));
  }

  if (starredState === "is_starred") {
    filterExprs.push(client.filter("starred_at != null"));
  } else if (starredState === "not_starred") {
    filterExprs.push(client.filter("starred_at = null"));
  }

  return filterExprs.join(" && ");
};

export const useLinksFeedMutation = (
  props: Props,
): GenericLynxMutator<FeedLink> => {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, options: _options }) => {
      const mutationResult = await pb
        .collection("links")
        .update<FeedQueryItem>(id, updates, {
          fields: getFields(),
          expand: "tags,created_from_feed,suggested_tags",
        });
      return convertFeedQueryItemToFeedLink(mutationResult);
    },
    onSuccess: (data, variables) => {
      const { id, options } = variables;
      queryClient.setQueryData(
        ["links", { source: "feed", ...props }],
        (oldData: DT) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((item) => {
              if (item.id === id) {
                return data;
              } else {
                return item;
              }
            }),
          };
        },
      );
      if (options?.onSuccessMessage) {
        notifications.show({
          title: "Link updated",
          message: options.onSuccessMessage,
          color: "green",
        });
      }
      if (options?.afterSuccess) {
        options.afterSuccess();
      }
    },
    onError: (error, variables) => {
      console.error("Failed to update link", error);
      if (variables?.options?.onErrorMessage) {
        notifications.show({
          title: "Failed to update link",
          message: variables.options.onErrorMessage,
          color: "red",
        });
      }
      if (variables?.options?.afterError) {
        variables.options.afterError(error);
      }
    },
  });
};

type DT = Omit<ListResult<FeedQueryItem>, "items"> & {
  items: FeedLink[];
};
const useLinksFeedQuery = (props: Props) => {
  const { pb } = usePocketBase();
  const authModel = pb.authStore.model;

  return useQuery({
    queryKey: ["links", { source: "feed", ...props }],
    queryFn: async ({
      queryKey,
    }: {
      queryKey: ["links", Props & { source: string }];
    }): Promise<DT> => {
      const [_1, { source: _source, ...queryProps }] = queryKey;
      const queryResult = await pb
        .collection("links")
        .getList<FeedQueryItem>(queryProps.page || 1, PAGE_SIZE, {
          filter: buildFilters(pb, queryProps),
          expand: "tags,created_from_feed,suggested_tags",
          sort: `-${queryProps.sortBy}`,
          fields: getFields(), // Ensure fields are explicitly requested
        });
      return {
        ...queryResult,
        items: queryResult.items.map(convertFeedQueryItemToFeedLink),
      };
    },
    enabled: !!authModel,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
};

export const useInvalidateLinksFeed = () => {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["links"] }),
    [queryClient],
  );
};

export default useLinksFeedQuery;
