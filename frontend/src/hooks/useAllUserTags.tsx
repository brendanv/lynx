import { usePocketBase } from "@/hooks/usePocketBase";
import type { TagWithMetadata } from "@/types/Tag";
import type Tag from "@/types/Tag";
import { useQuery } from "@tanstack/react-query";

const useAllUserTagsWithoutMetadata = () => {
  const { user, pb } = usePocketBase();
  return useQuery({
    queryKey: ["tags", "all", user?.id, { metadata: false }],
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

export default function useAllUserTags() {
  const { user, pb } = usePocketBase();
  return useQuery({
    queryKey: ["tags", "all", user?.id, { metadata: true}],
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
