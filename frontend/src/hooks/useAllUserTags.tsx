import { useState, useEffect } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import type { TagWithMetadata } from "@/types/Tag";
import type Tag from "@/types/Tag";

const useAllUserTagsWithoutMetadata = () => {
  const { user, pb } = usePocketBase();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, [user]);

  const fetchTags = async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection("tags").getFullList<Tag>({
        sort: "name",
        filter: `user="${user.id}"`,
      });
      setTags(records);
      setError(null);
    } catch (err) {
      console.error("Error fetching tags:", err);
      setError("Failed to fetch tags. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { tags, loading, error, refetch: fetchTags };
};

export { useAllUserTagsWithoutMetadata };

export default function useAllUserTags() {
  const { user, pb } = usePocketBase();
  const [tags, setTags] = useState<TagWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, [user]);

  const fetchTags = async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const records = await pb
        .collection("tags_metadata")
        .getFullList<TagWithMetadata>({
          sort: "name",
          filter: `user="${user.id}"`,
        });
      setTags(records);
      setError(null);
    } catch (err) {
      console.error("Error fetching tags:", err);
      setError("Failed to fetch tags. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { tags, loading, error, refetch: fetchTags };
}
