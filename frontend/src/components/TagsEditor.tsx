import { useState, useEffect } from "react";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import { Button, Center, Chip, Group, Loader } from "@mantine/core";
import type FeedLink from "@/types/FeedLink";
import type { LinkView } from "@/hooks/useLinkViewerQuery";
import { GenericLynxMutator } from "@/types/Mutations";

interface Props {
  link: FeedLink | LinkView;
  linkMutator: GenericLynxMutator<FeedLink | LinkView>;
}

const TagsEditor = ({ link, linkMutator }: Props) => {
  const tagsQuery = useAllUserTagsWithoutMetadata();
  const allTags = tagsQuery.status === "success" ? tagsQuery.data : [];
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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
    linkMutator.mutate({
      id: link.id,
      updates: { tags: selectedTagIds },
      options: {
        afterSuccess: () => {
          setHasChanges(false);
        },
        onErrorMessage: "Unable to save tags",
      }
    })
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
        <Button loading={linkMutator.isPending} onClick={saveTags} disabled={!hasChanges}>
          Save Changes
        </Button>
      </Group>
    </>
  );
};
export default TagsEditor;
