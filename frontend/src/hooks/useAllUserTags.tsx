import { usePocketBase } from "@/hooks/usePocketBase";
import { GenericLynxCreationMutator } from "@/types/Mutations";
import type { TagWithMetadata } from "@/types/Tag";
import type Tag from "@/types/Tag";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

const useAllUserTagsWithoutMetadata = () => {
  const { user, pb } = usePocketBase();
  return useQuery({
    queryKey: ["tags", "all", user?.id || "", { metadata: false }],
    staleTime: 60 * 1000,
    queryFn: async ({
      queryKey,
    }: {
      queryKey: ["tags", "all", string | null, { metadata: boolean }];
    }) => {
      const [_1, _2, user_id, _3] = queryKey;
      return await pb.collection("tags").getFullList<Tag>({
        sort: "name",
        filter: pb.filter("user = {:user}", { user: user_id }),
      });
    },
    enabled: !!user?.id,
  });
};

export { useAllUserTagsWithoutMetadata };

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const useCreateNewTagMutation = (): GenericLynxCreationMutator<
  Tag,
  { tagName: string }
> => {
  const { user, pb } = usePocketBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fields: { tagName }, options: _options }) => {
      const slug = generateSlug(tagName);
      return await pb.collection("tags").create({
        name: tagName,
        slug: slug,
        user: user?.id,
      });
    },
    onSuccess: (_data, variables) => {
      const { options } = variables;
      queryClient.invalidateQueries({ queryKey: ["tags", "all", user?.id] });
      if (options?.onSuccessMessage) {
        notifications.show({
          title: "Tag created",
          message: options.onSuccessMessage,
          color: "green",
        });
      }
      if (options?.afterSuccess) {
        options.afterSuccess();
      }
    },
    onError: (error, variables) => {
      console.error("Failed to create Tag", error);
      if (variables?.options?.onErrorMessage) {
        notifications.show({
          title: "Failed to create tag",
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

export { useCreateNewTagMutation };

export default function useAllUserTags() {
  const { user, pb } = usePocketBase();
  return useQuery({
    queryKey: ["tags", "all", user?.id || "", { metadata: true }],
    staleTime: 60 * 1000,
    queryFn: async ({
      queryKey,
    }: {
      queryKey: ["tags", "all", string | null, { metadata: boolean }];
    }) => {
      const [_1, _2, user_id, _3] = queryKey;
      return await pb.collection("tags_metadata").getFullList<TagWithMetadata>({
        sort: "name",
        filter: pb.filter("user = {:user}", { user: user_id }),
      });
    },
    enabled: !!user?.id,
  });
}
