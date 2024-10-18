import { usePocketBase } from "@/hooks/usePocketBase";
import type Feed from "@/types/Feed";
import { useQuery } from "@tanstack/react-query";

const useAllUserFeeds = () => {
  const { user, pb } = usePocketBase();
  return useQuery({
    queryKey: ["feeds", "all", user?.id],
    staleTime: 60 * 1000,
    queryFn: async ({
      queryKey,
    }: {
      queryKey: ["feeds", "all", string | null];
    }) => {
      const [_1, _2, user_id] = queryKey;
      return await pb.collection("feeds").getFullList<Feed>({
        sort: "name",
        filter: pb.filter("user = {:user}", { user: user_id }),
      });
    },
    enabled: !!user?.id,
  });
};

export default useAllUserFeeds;
