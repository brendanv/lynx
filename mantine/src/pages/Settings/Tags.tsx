import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import useAllUserTags from "@/hooks/useAllUserTags";
import {
  ActionIcon,
  Anchor,
  Center,
  Container,
  Loader,
  TextInput,
  Button,
  Table,
  Group,
  Text,
  Alert,
  Stack,
  rem,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconPlus, IconTrash } from "@tabler/icons-react";
import URLS from "@/lib/urls";
import DrawerDialog from "@/components/DrawerDialog";

const Tags: React.FC = () => {
  const { pb, user } = usePocketBase();
  const {
    tags,
    loading: isLoading,
    error,
    refetch: fetchTags,
  } = useAllUserTags();
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<any>(null);

  const form = useForm({
    initialValues: {
      tagName: "",
    },
    validate: {
      tagName: (value) =>
        value.trim().length > 0 ? null : "Tag name is required",
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const handleSubmit = async (values: { tagName: string }) => {
    try {
      const slug = generateSlug(values.tagName);
      await pb.collection("tags").create({
        name: values.tagName,
        slug: slug,
        user: user?.id,
      });
      form.reset();
      notifications.show({
        message: "Tag created successfully",
        color: "green",
      });
      fetchTags();
    } catch (error) {
      console.error("Error creating tag:", error);
      notifications.show({
        message: "Failed to create tag. Please try again.",
        color: "red",
      });
    }
  };

  const handleDeleteClick = (tag: any) => {
    setTagToDelete(tag);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;

    try {
      await pb.collection("tags").delete(tagToDelete.id);
      notifications.show({
        message: "Tag deleted successfully",
        color: "green",
      });
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      notifications.show({
        message: "Failed to delete tag. Please try again.",
        color: "red",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setTagToDelete(null);
    }
  };

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
      }
      return 0;
    });
  }, [tags, sortField, sortDirection]);

  return (
    <Container mt="md">
      {!user && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          mb="md"
        >
          Please log in to view tags.
        </Alert>
      )}
      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          mb="md"
        >
          Error: {error}
        </Alert>
      )}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          radius="xl"
          size="md"
          mb="lg"
          placeholder="Enter tag name"
          {...form.getInputProps("tagName")}
          rightSectionWidth={42}
          rightSection={
            <ActionIcon type="submit" size={32} radius="xl" variant="filled">
              <IconPlus
                style={{ width: rem(18), height: rem(18) }}
                stroke={1.5}
              />
            </ActionIcon>
          }
        />
      </form>

      {isLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <Table.ScrollContainer minWidth={500}>
          <Table>
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
                <Table.Th></Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedTags.map((tag) => (
                <Table.Tr key={tag.id}>
                  <Table.Td>{tag.name}</Table.Td>
                  <Table.Td>{tag.link_count}</Table.Td>
                  <Table.Td>
                    <Anchor
                      component={Link}
                      to={URLS.HOME_WITH_TAGS_SEARCH(tag.id)}
                    >
                      View Links
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      variant="outline"
                      color="red"
                      size="xs"
                      onClick={() => handleDeleteClick(tag)}
                      leftSection={<IconTrash size="1rem" />}
                    >
                      Delete
                    </Button>
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
            Are you sure you want to delete the tag "{tagToDelete?.name}"? This
            will remove it from {tagToDelete?.link_count} links.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Group>
        </Stack>
      </DrawerDialog>
    </Container>
  );
};

export default Tags;
