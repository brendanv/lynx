import { useState } from "react";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import {
  Alert,
  Button,
  Center,
  Chip,
  Group,
  Loader,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { usePocketBase } from "@/hooks/usePocketBase";
import { useInvalidateLinksFeed } from "@/hooks/useLinksFeedQuery";
import CreateNewTagInput from "@/components/CreateNewTagInput";
import { IconAlertSquareRounded } from "@tabler/icons-react";

interface Props {
  selectedItems: Set<string>;
  onComplete: () => void;
}

const BulkTagsEditor = ({ selectedItems, onComplete }: Props) => {
  const tagsQuery = useAllUserTagsWithoutMetadata();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { pb } = usePocketBase();
  const invalidateLinksFeed = useInvalidateLinksFeed();

  const allTags = tagsQuery.status === "success" ? tagsQuery.data : [];

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      return [...prev, tagId];
    });
  };

  const handleSave = async () => {
    if (selectedTagIds.length === 0) {
      notifications.show({
        title: "Error",
        message: "Please select at least one tag to add",
        color: "red",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = Array.from(selectedItems).map((linkId) =>
        pb.collection("links").update(linkId, {
          tags: selectedTagIds,
        }),
      );

      await Promise.all(promises);
      await invalidateLinksFeed();

      notifications.show({
        title: "Success",
        message: "Tags updated for selected items",
      });

      onComplete();
    } catch (error) {
      console.error("Error updating tags:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update tags",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
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
      <CreateNewTagInput />
      <Group>
        {allTags.map((tag) => (
          <Chip
            key={tag.id}
            checked={selectedTagIds.includes(tag.id)}
            onChange={() => toggleTag(tag.id)}
          >
            {tag.name}
          </Chip>
        ))}
      </Group>
      <Stack mt="lg">
        <Center>
          <Alert
            p="xs"
            variant="outline"
            color="orange"
            icon={<IconAlertSquareRounded />}
          >
            This will overwrite any current tags!
          </Alert>
        </Center>
        <Group grow>
          <Button
            loading={isSubmitting}
            onClick={handleSave}
            disabled={selectedTagIds.length === 0}
          >
            Set Tags for Selected Items
          </Button>
        </Group>
      </Stack>
    </>
  );
};

export default BulkTagsEditor;
