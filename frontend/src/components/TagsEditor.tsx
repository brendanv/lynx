import { useState, useEffect } from "react";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import {
  Button,
  Center,
  Chip,
  Group,
  Loader,
  Text,
  Title,
  Stack,
  ActionIcon,
} from "@mantine/core";
import { IconX, IconPlus } from "@tabler/icons-react";
import { GenericLynxMutator } from "@/types/Mutations";
import Tag from "@/types/Tag";
import CreateNewTagInput from "@/components/CreateNewTagInput";

interface Taggable {
  id: string;
  tags: Tag[];
  suggested_tags?: Tag[];
}

interface Props {
  link: Taggable;
  linkMutator: GenericLynxMutator<Taggable>;
  afterSave?: () => void;
}

const TagsEditor = ({ link, linkMutator, afterSave }: Props) => {
  const tagsQuery = useAllUserTagsWithoutMetadata();
  const allTags = tagsQuery.status === "success" ? tagsQuery.data : [];
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const currentLinkTagIds = (link.tags || []).map((t) => t.id);
    setSelectedTagIds(currentLinkTagIds);
    setHasChanges(false); // Reset hasChanges because we're syncing with the source of truth
  }, [link.id, link.tags]); // Rerun if the link item changes or its tags array changes

  const removeTag = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    setHasChanges(true);
  };

  const addTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (!prev.includes(tagId)) {
        return [...prev, tagId];
      }
      return prev;
    });
    setHasChanges(true);
  };

  const handleAddSuggestedTag = (tagId: string) => {
    addTag(tagId);
  };

  const currentSuggestedTagsToDisplay = (link.suggested_tags || []).filter(
    // Only show suggestions that are not already in selectedTagIds
    (st) => !selectedTagIds.includes(st.id),
  );

  const handleDismissSuggestedTag = (tagId: string) => {
    const newSuggestedBackendTags = (link.suggested_tags || [])
      .filter((t) => t.id !== tagId)
      .map((t) => t.id);

    linkMutator.mutate({
      id: link.id,
      updates: { suggested_tags: newSuggestedBackendTags },
      options: {
        onSuccessMessage: "Suggestion dismissed",
        onErrorMessage: "Unable to dismiss suggestion",
      },
    });
  };

  const handleDismissAllDisplayedSuggestions = () => {
    const idsToDismiss = currentSuggestedTagsToDisplay.map((t) => t.id);
    const newSuggestedBackendTags = (link.suggested_tags || [])
      .filter((t) => !idsToDismiss.includes(t.id))
      .map((t) => t.id);

    linkMutator.mutate({
      id: link.id,
      updates: { suggested_tags: newSuggestedBackendTags },
      options: {
        onSuccessMessage: "Displayed suggestions dismissed",
        onErrorMessage: "Unable to dismiss displayed suggestions",
        // Rely on query invalidation
      },
    });
  };

  const saveTags = async () => {
    setIsSaving(true);
    const finalSelectedTagIds = [...selectedTagIds];
    const finalSuggestedTagIds = (link.suggested_tags || [])
      .map((t) => t.id)
      .filter((id) => !finalSelectedTagIds.includes(id));

    linkMutator.mutate({
      id: link.id,
      updates: {
        tags: finalSelectedTagIds,
        suggested_tags: finalSuggestedTagIds,
      },
      options: {
        afterSuccess: () => {
          setHasChanges(false);
          setIsSaving(false);
          if (afterSave) {
            afterSave();
          }
        },
        afterError: () => {
          setIsSaving(false);
        },
        onErrorMessage: "Unable to save tags",
      },
    });
  };

  if (tagsQuery.isFetching) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <CreateNewTagInput />

      {link.suggested_tags && link.suggested_tags.length > 0 && (
        <Stack gap="xs" mt="sm">
          <Group justify="space-between">
            <Title order={5}>Suggestions</Title>
            {currentSuggestedTagsToDisplay.length > 0 && (
              <Button
                variant="light"
                size="xs"
                color="red"
                onClick={handleDismissAllDisplayedSuggestions}
                disabled={linkMutator.isPending}
              >
                Dismiss All Displayed
              </Button>
            )}
          </Group>
          {currentSuggestedTagsToDisplay.length > 0 ? (
            <Group gap="xs" wrap="wrap">
              {currentSuggestedTagsToDisplay.map((tag) => (
                <Group
                  key={tag.id}
                  gap="xs"
                  style={{
                    border: "1px solid var(--mantine-color-gray-4)",
                    padding:
                      "var(--mantine-spacing-xs) var(--mantine-spacing-sm)",
                    borderRadius: "var(--mantine-radius-sm)",
                  }}
                  align="center"
                >
                  <Text size="sm" style={{ lineHeight: 1 }}>
                    {tag.name}
                  </Text>
                  <ActionIcon
                    variant="light"
                    size="sm"
                    onClick={() => handleAddSuggestedTag(tag.id)}
                    disabled={linkMutator.isPending}
                    aria-label={`Add tag ${tag.name}`}
                  >
                    <IconPlus size={14} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() => handleDismissSuggestedTag(tag.id)}
                    disabled={linkMutator.isPending}
                    aria-label={`Dismiss suggestion ${tag.name}`}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              All suggestions have been added or previously dismissed.
            </Text>
          )}
        </Stack>
      )}
      {(!link.suggested_tags || link.suggested_tags.length === 0) &&
        linkMutator.isIdle && (
          <Text size="sm" c="dimmed" mt="sm">
            No suggestions available for this link.
          </Text>
        )}

      {/* Manage Applied Tags Section */}
      <Stack gap="xs" mt="md">
        <Title order={5}>Applied Tags</Title>
        {allTags.length > 0 ? (
          <Group gap="xs" wrap="wrap">
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
                  disabled={linkMutator.isPending}
                >
                  {tag.name}
                </Chip>
              );
            })}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            No tags created yet. Use the input above to create new tags.
          </Text>
        )}
      </Stack>

      <Group mt="lg">
        <Button
          loading={isSaving}
          onClick={saveTags}
          disabled={!hasChanges || linkMutator.isPending}
        >
          Save Changes
        </Button>
      </Group>
    </Stack>
  );
};
export default TagsEditor;
