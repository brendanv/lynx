import { usePocketBase } from "@/hooks/usePocketBase";
import type FeedLink from "@/types/FeedLink";
import type Tag from "@/types/Tag";
import Client, { ListResult } from "pocketbase";
import { useEffect, useState } from "react";

const PAGE_SIZE = 15;

type Props = {
  page?: number;
  readState?: "unread" | "read" | "all";
  tagId?: string;
  searchText?: string;
  feedId?: string;
  sortBy: "added_to_library" | "article_date";
};

type QueryResult = {
  loading: boolean;
  error: Error | null;
  result: ListResult<FeedLink> | null;
  refetch: (() => Promise<void>) | null;
};

export type FeedQueryItem = {
  id: string;
  added_to_library: string;
  article_date: string | null;
  author: string | null;
  collectionId: string;
  collectionName: string;
  excerpt: string | null;
  expand?: { tags: Tag[] };
  header_image_url: string | null;
  hostname: string | null;
  last_viewed_at: string | null;
  read_time_display: string | null;
  tags: string[];
  title: string | null;
  user: string;
  archive: string | null;
};

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
    title: item.title,
    tags:
      item.expand && item.expand.tags
        ? item.expand.tags.map(({ id, name, slug }) => ({
            id,
            name,
            slug,
          }))
        : [],
    archive: item.archive,
  };
};

const buildFilters = (client: Client, props: Props) => {
  const { readState, tagId, searchText, feedId } = props;
  const filterExprs: string[] = [];

  if (readState === "unread") {
    filterExprs.push(client.filter("last_viewed_at = null"));
  } else if (readState === "read") {
    filterExprs.push(client.filter("last_viewed_at != null"));
  }

  if (tagId) {
    filterExprs.push(client.filter("tags.id ?= {:tagId}", { tagId }));
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

  return filterExprs.join(" && ");
};

const useLinksFeedQuery = (props: Props): QueryResult => {
  const { pb } = usePocketBase();
  const authModel = pb.authStore.model;
  if (authModel === null) {
    return { loading: false, error: null, result: null, refetch: null };
  }

  const [result, setResult] = useState<ListResult<FeedLink> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryResult = await pb
        .collection("links_feed")
        .getList<FeedQueryItem>(props.page || 1, PAGE_SIZE, {
          filter: buildFilters(pb, props),
          expand: "tags",
          sort: `-${props.sortBy}`,
        });
      setResult({
        ...queryResult,
        items: queryResult.items.map(convertFeedQueryItemToFeedLink),
      });
      setError(null);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    props.page,
    props.readState,
    props.tagId,
    props.searchText,
    props.sortBy,
    props.feedId,
    authModel.id,
  ]);

  return { result, loading, error, refetch: fetchData };
};

export default useLinksFeedQuery;
