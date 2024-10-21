import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { usePocketBase } from "@/hooks/usePocketBase";
import Client, { ListResult } from "pocketbase";
import { GenericLynxMutator } from "@/types/Mutations";
import { notifications } from "@mantine/notifications";
import Tag from "@/types/Tag";

type Props = {
  page?: number;
  linkId?: string;
  tagId?: string;
  searchText?: string;
  sort: "newest_first" | "oldest_first";
};

export type Highlight = {
  id: string;
  highlighted_text: string;
  created: Date | null;
  updated: Date | null;
  linkId?: string | null;
  linkTitle?: string | null;
  linkUrl?: string | null;
  linkHostname?: string | null;
  linkAuthor?: string | null;
  tags: Tag[];
};

// Works for 2- and 3-column grids
const PAGE_SIZE = 18;

const getFields = () =>
  [
    "id",
    "link",
    "created",
    "updated",
    "expand.link.id",
    "expand.link.title",
    "expand.link.cleaned_url",
    "expand.link.hostname",
    "expand.link.author",
    "tags",
    "expand.tags.*",
    "highlighted_text",
  ].join(",");

const buildFilters = (client: Client, props: Props) => {
  const { linkId, tagId, searchText } = props;
  const filterExprs: string[] = [];

  if (tagId) {
    filterExprs.push(client.filter("tags.id ?= {:tagId}", { tagId }));
  }

  if (linkId) {
    filterExprs.push(client.filter("link ?= {:linkId}", { linkId }));
  }

  if (searchText) {
    filterExprs.push(
      client.filter("highlighted_text ~ {:searchText}", { searchText }),
    );
  }

  return filterExprs.join(" && ");
};

export const useUserHighlightMutation = (
  props: Props,
): GenericLynxMutator<Highlight> => {
  const { pb, user } = usePocketBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, options: _options }) => {
      const mutationResult = await pb
        .collection("highlights")
        .update<Highlight>(id, updates, {
          fields: getFields(),
          expand: "link,tags",
        });
      return convertQueryItemToHighlight(mutationResult);
    },
    onSuccess: (data, variables) => {
      const { id, options } = variables;
      queryClient.setQueryData(
        ["highlights", { ...props, user: user?.id }],
        (oldData: ListResult<Highlight>) => {
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
          title: "Highlight updated",
          message: options.onSuccessMessage,
          color: "green",
        });
      }
      if (options?.afterSuccess) {
        options.afterSuccess();
      }
    },
    onError: (error, variables) => {
      console.error("Failed to update highlight", error);
      if (variables?.options?.onErrorMessage) {
        notifications.show({
          title: "Failed to update highlight",
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

const convertQueryItemToHighlight = (item: any): Highlight => {
  return {
    id: item.id,
    highlighted_text: item.highlighted_text,
    created: item.created ? new Date(item.created) : null,
    updated: item.updated ? new Date(item.updated) : null,
    linkId: item.expand?.link?.id,
    linkTitle: item.expand?.link?.title || item.link_backup_title,
    linkUrl: item.expand?.link?.cleaned_url || item.link_backup_url,
    linkHostname: item.expand?.link?.hostname || item.link_backup_hostname,
    linkAuthor: item.expand?.link?.author,
    tags:
      item.expand && item.expand.tags
        ? item.expand.tags.map(({ id, name, slug }: any) => ({
            id,
            name,
            slug,
          }))
        : [],
  };
};

const useUserHighlightsQuery = (props: Props) => {
  const { pb, user } = usePocketBase();

  return useQuery({
    queryKey: ["highlights", { ...props, user: user?.id }],
    queryFn: async ({
      queryKey,
    }: {
      queryKey: ["highlights", Props & { user?: string }];
    }): Promise<ListResult<Highlight>> => {
      const [_1, queryProps] = queryKey;
      console.log(buildFilters(pb, queryProps));
      const queryResult = await pb
        .collection("highlights")
        .getList(queryProps.page || 1, PAGE_SIZE, {
          fields: getFields(),
          filter: buildFilters(pb, queryProps),
          expand: "link,tags",
          sort: `${queryProps.sort == "newest_first" ? "-" : ""}created`,
        });
      return {
        ...queryResult,
        items: queryResult.items.map(convertQueryItemToHighlight),
      };
    },
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
};

export default useUserHighlightsQuery;
