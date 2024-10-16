import { useState, useEffect } from "react";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import { usePocketBase } from "@/hooks/usePocketBase";
import { Button, Center, Chip, Group, Loader } from "@mantine/core";
import type FeedLink from "@/types/FeedLink";
import type { LinkView } from "@/hooks/useLinkViewerQuery";
import { notifications } from "@mantine/notifications";

interface Props {
  link: FeedLink | LinkView;
  refetch: (() => Promise<void>) | null;
}

const TagsEditor = ({ link, refetch }: Props) => {
  const { pb } = usePocketBase();
  const tagsQuery = useAllUserTagsWithoutMetadata();
  const allTags = tagsQuery.status === 'success' ? tagsQuery.data : [];
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initiallySelectedTags = allTags.filter(
      (t) => link.tags.find((lt) => lt.id === t.id) !== undefined,
    );
    setHasChanges(false);
    setSelectedTagIds(initiallySelectedTags.map((t) => t.id));
  }, [link, allTags]);

  const removeTag = (tagId: string) => {
    setSelectedTagIds((selectedTagIds) =>
      selectedTagIds.filter((id) => id !== tagId),
    );
    setHasChanges(true);
  };
  const addTag = (tagId: string) => {
    setSelectedTagIds(selectedTagIds.concat(tagId));
    setHasChanges(true);
  };

  const saveTags = async () => {
    setIsSaving(true);
    try {
      await pb.collection("links").update(link.id, {
        tags: selectedTagIds,
      });
      setHasChanges(false);
      refetch && refetch();
    } catch (error) {
      console.error("Error updating tags:", error);
      notifications.show({
        title: "Error",
        message: "Unable to save tags",
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (tagsQuery.isFetching) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  return (
    <>
      <Group>
        {allTags.map((tag) => {
          const isChecked = selectedTagIds.includes(tag.id);
          return (
            <Chip
              key={tag.id}
              checked={isChecked}
              onChange={() => {
                if (isChecked) {
                  removeTag(tag.id);
                } else {
                  addTag(tag.id);
                }
              }}
            >
              {tag.name}
            </Chip>
          );
        })}
      </Group>
      <Group mt="lg" grow>
        <Button loading={isSaving} onClick={saveTags} disabled={!hasChanges}>
          Save Changes
        </Button>
      </Group>
    </>
  );
};
export default TagsEditor;
