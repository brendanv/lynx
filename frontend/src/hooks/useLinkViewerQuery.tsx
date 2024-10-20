import { usePocketBase } from "@/hooks/usePocketBase";
import type Tag from "@/types/Tag";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import Client from "pocketbase";
import { notifications } from "@mantine/notifications";
import { GenericLynxMutator } from "@/types/Mutations";

export type LinkView = {
  id: string;
  article_date: Date | null;
  author: string | null;
  excerpt: string | null;
  header_image_url: string | null;
  hostname: string | null;
  last_viewed_at: Date | null;
  read_time_display: string | null;
  tags: Tag[];
  highlights: {
    id: string;
    serialized_range: string;
  }[];
  title: string | null;
  cleaned_url: string | null;
  article_html: string | null;
  reading_progress: number | null;
};

type RawLinkQueryResult = {
  id: string;
  article_date: string | null;
  author: string | null;
  excerpt: string | null;
  expand?: {
    tags?: Tag[];
    highlights_via_link?: { id: string; serialized_range: string }[];
  };
  header_image_url: string | null;
  hostname: string | null;
  last_viewed_at: string | null;
  read_time_display: string | null;
  tags: string[];
  cleaned_url: string | null;
  article_html: string | null;
  reading_progress: number | null;
  title: string | null;
};

const queryResultToLinkView = (queryResult: RawLinkQueryResult): LinkView => ({
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
  highlights:
    queryResult.expand && queryResult.expand.highlights_via_link
      ? queryResult.expand.highlights_via_link
      : [],
});

// Must be kept in sync with above
const getFields = () =>
  [
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
    "reading_progress",
    "expand.tags.*",
    "expand.highlights_via_link.id",
    "expand.highlights_via_link.serialized_range",
  ].join(",");
const getExpand = () => ['tags', 'highlights_via_link'].join(",");

export const useLinkViewerMutation = (): GenericLynxMutator<LinkView> => {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, options: _options }) => {
      const mutationResult = await pb
        .collection("links")
        .update<RawLinkQueryResult>(id, updates, {
          fields: getFields(),
          expand: getExpand(),
        });
      return queryResultToLinkView(mutationResult);
    },
    onSuccess: (data, variables) => {
      const { id, options } = variables;
      queryClient.setQueryData(["link", { id, type: "full" }], data);
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

const useLinkViewerQuery = (id: string, updateLastViewedAt: boolean) => {
  const { pb } = usePocketBase();
  const authModel = pb.authStore.model;

  return useQuery({
    queryKey: ["link", { id, type: "full" }],
    queryFn: async ({
      queryKey,
    }: {
      queryKey: ["link", { id: string; type: string }];
    }) => {
      const [_1, { id: queryId }] = queryKey;
      return await runQuery(queryId, pb, updateLastViewedAt);
    },
    staleTime: 60 * 1000,
    enabled: !!authModel,
  });
};

const runQuery = async (
  id: string,
  client: Client,
  updateLastViewedAt: boolean,
): Promise<LinkView> => {
  const queryResult = await client
    .collection("links")
    .getOne<RawLinkQueryResult>(id, {
      expand: getExpand(),
      fields: getFields(),
      headers: updateLastViewedAt
        ? { "X-Lynx-Update-Last-Viewed": "true" }
        : {},
    });
  return queryResultToLinkView(queryResult);
};

export default useLinkViewerQuery;
