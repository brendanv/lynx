import { usePocketBase } from "@/hooks/usePocketBase";
import type Tag from "@/types/Tag";
import Client from "pocketbase";
import { useEffect, useState } from "react";

type QueryResult = {
  loading: boolean;
  error: Error | null;
  result: LinkView | null;
};

type LinkView = {
  id: string;
  article_date: Date | null;
  author: string | null;
  excerpt: string | null;
  header_image_url: string | null;
  hostname: string | null;
  last_viewed_at: Date | null;
  read_time_display: string | null;
  tags: Tag[];
  title: string | null;
  cleaned_url: string | null;
  article_html: string | null;
};

const useLinkViewerQuery = (id: string): QueryResult => {
  const { pb } = usePocketBase();
  const authModel = pb.authStore.model;
  if (authModel === null) {
    return { loading: false, error: null, result: null };
  }

  const [link, setLink] = useState<LinkView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const linkResult = await runQuery(id, pb);
        setLink(linkResult);
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, authModel.id]);

  return { result: link, loading, error };
};

const runQuery = async (id: string, client: Client): Promise<LinkView> => {
  const queryResult = await client.collection("links").getOne<{
    id: string;
    article_date: string | null;
    author: string | null;
    excerpt: string | null;
    expand?: { tags: Tag[] };
    header_image_url: string | null;
    hostname: string | null;
    last_viewed_at: string | null;
    read_time_display: string | null;
    tags: string[];
    cleaned_url: string | null;
    article_html: string | null;
    title: string | null;
  }>(id, {
    expand: "tags",
    fields: [
      "id",
      "article_date",
      "author",
      "excerpt",
      "header_image_url",
      "hostname",
      "last_viewed_at",
      "read_time_display",
      "title",
      "tags",
      "cleaned_url",
      "article_html",
      "expand.tags.*",
    ].join(","),
  });
  return {
    ...queryResult,
    article_date: queryResult.article_date
      ? new Date(queryResult.article_date)
      : null,
    last_viewed_at: queryResult.last_viewed_at
      ? new Date(queryResult.last_viewed_at)
      : null,
    tags:
      queryResult.expand && queryResult.expand.tags
        ? queryResult.expand.tags.map(({ id, name, slug }) => ({
            id,
            name,
            slug,
          }))
        : [],
  };
};

export default useLinkViewerQuery;
