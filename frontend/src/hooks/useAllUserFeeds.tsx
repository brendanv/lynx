import { useState, useEffect } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import type Feed from "@/types/Feed";

const useAllUserFeeds = () => {
  const { user, pb } = usePocketBase();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeeds();
  }, [user]);

  const fetchFeeds = async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection("feeds").getFullList<Feed>({
        sort: "name",
        filter: pb.filter("user = {:user}", { user: user.id }),
      });
      setFeeds(records);
      setError(null);
    } catch (err) {
      console.error("Error fetching feeds:", err);
      setError("Failed to fetch feeds. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { feeds, loading, error, refetch: fetchFeeds };
};

export default useAllUserFeeds;
