import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import useAllUserTags from "@/hooks/useAllUserTags";
import {
  Anchor,
  Center,
  Container,
  Loader,
  Button,
  Table,
  Group,
  Text,
  Alert,
  Stack,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconTrash, IconEdit } from "@tabler/icons-react";
import URLS from "@/lib/urls";
import DrawerDialog from "@/components/DrawerDialog";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TagWithMetadata } from "@/types/Tag";
import CreateNewTagInput from "@/components/CreateNewTagInput";

const Tags: React.FC = () => {
  usePageTitle("Tags");
  const { pb, user } = usePocketBase();
  const tagsQuery = useAllUserTags();
  const tags = tagsQuery.status === "success" ? tagsQuery.data : [];
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagWithMetadata | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [tagToRename, setTagToRename] = useState<TagWithMetadata | null>(null);
  const [newTagName, setNewTagName] = useState("");

  const handleDeleteClick = (tag: TagWithMetadata) => {
    setTagToDelete(tag);
    setIsDeleteModalOpen(true);
  };

  const handleRenameClick = (tag: TagWithMetadata) => {
    setTagToRename(tag);
    setNewTagName(tag.name);
    setIsRenameModalOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ tag }: { tag: TagWithMetadata }) => {
      return await pb.collection("tags").delete(tag.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", "all", user?.id] });
      setIsDeleteModalOpen(false);
      setTagToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting tag:", error);
      notifications.show({
        message: "Failed to delete tag. Please try again.",
        color: "red",
      });
      setIsDeleteModalOpen(false);
      setTagToDelete(null);
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({
      tag,
      newName,
    }: {
      tag: TagWithMetadata;
      newName: string;
    }) => {
      const slug = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      return await pb.collection("tags").update(tag.id, {
        name: newName,
        slug: slug,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", "all", user?.id] });
      setIsRenameModalOpen(false);
      setTagToRename(null);
      setNewTagName("");
      notifications.show({
        message: "Tag renamed successfully",
        color: "green",
      });
    },
    onError: (error) => {
      console.error("Error renaming tag:", error);
      notifications.show({
        message: "Failed to rename tag. Please try again.",
        color: "red",
      });
    },
  });

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "link_count") {
        return sortDirection === "asc"
          ? a.link_count - b.link_count
          : b.link_count - a.link_count;
      } else if (sortField === "highlight_count") {
        return sortDirection === "asc"
          ? a.highlight_count - b.highlight_count
          : b.highlight_count - a.highlight_count;
      }
      return 0;
    });
  }, [tags, sortField, sortDirection]);

  return (
    <Container mt="md">
      {tagsQuery.error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          mb="md"
        >
          Error: {String(tagsQuery.error)}
        </Alert>
      )}

      <CreateNewTagInput />

      {tagsQuery.isPending ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <Table.ScrollContainer minWidth={500}>
          <Table>
            <Table.Caption>{`${tags.length} Tag${tags.length !== 1 ? "s" : ""}`}</Table.Caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th
                  onClick={() => handleSort("name")}
                  style={{ cursor: "pointer" }}
                >
                  Name{" "}
                  {sortField === "name" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </Table.Th>
                <Table.Th
                  onClick={() => handleSort("link_count")}
                  style={{ cursor: "pointer" }}
                >
                  Link Count{" "}
                  {sortField === "link_count" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </Table.Th>
                <Table.Th
                  onClick={() => handleSort("highlight_count")}
                  style={{ cursor: "pointer" }}
                >
                  Highlight Count{" "}
                  {sortField === "highlight_count" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedTags.map((tag) => (
                <Table.Tr key={tag.id}>
                  <Table.Td>{tag.name}</Table.Td>
                  <Table.Td>
                    {tag.link_count} (
                    <Anchor
                      component={Link}
                      to={URLS.HOME_WITH_TAGS_SEARCH(tag.id)}
                    >
                      See all
                    </Anchor>
                    )
                  </Table.Td>
                  <Table.Td>
                    {tag.highlight_count} (
                    <Anchor
                      component={Link}
                      to={URLS.HIGHLIGHTS_WITH_TAG_SEARCH(tag.id)}
                    >
                      See all
                    </Anchor>
                    )
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleRenameClick(tag)}
                        leftSection={<IconEdit size="1rem" />}
                      >
                        Rename
                      </Button>
                      <Button
                        variant="outline"
                        color="red"
                        size="xs"
                        onClick={() => handleDeleteClick(tag)}
                        leftSection={<IconTrash size="1rem" />}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <DrawerDialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <Stack>
          <Text>
            Are you sure you want to delete the tag &quot;{tagToDelete?.name}
            &quot;? This will remove it from {tagToDelete?.link_count} links and{" "}
            {tagToDelete?.highlight_count} highlights.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() =>
                tagToDelete && deleteMutation.mutate({ tag: tagToDelete })
              }
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </DrawerDialog>

      <DrawerDialog
        open={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setTagToRename(null);
          setNewTagName("");
        }}
        title="Rename Tag"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (tagToRename && newTagName.trim()) {
              renameMutation.mutate({
                tag: tagToRename,
                newName: newTagName.trim(),
              });
            }
          }}
        >
          <Stack>
            <TextInput
              label="Tag Name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              required
              autoFocus
            />
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRenameModalOpen(false);
                  setTagToRename(null);
                  setNewTagName("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !newTagName.trim() || newTagName.trim() === tagToRename?.name
                }
                loading={renameMutation.isPending}
              >
                Rename
              </Button>
            </Group>
          </Stack>
        </form>
      </DrawerDialog>
    </Container>
  );
};

export default Tags;
