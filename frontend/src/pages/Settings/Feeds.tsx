import React, { useState } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import {
  Center,
  Container,
  Title,
  Button,
  TextInput,
  Switch,
  Card,
  Text,
  Group,
  ActionIcon,
  Menu,
  Alert,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconDots, IconEye, IconTrash } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import URLS from "@/lib/urls";
import useAllUserFeeds from "@/hooks/useAllUserFeeds";
import { usePageTitle } from "@/hooks/usePageTitle";
import DrawerDialog from "@/components/DrawerDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Feed = {
  id: string;
  name: string;
  feed_url: string;
  description: string;
  image_url: string;
  auto_add_feed_items_to_library: boolean;
  last_fetched_at: string;
};

const Feeds = () => {
  usePageTitle("Feeds");
  const feedsQuery = useAllUserFeeds();

  let inner = null;
  if (feedsQuery.status === "pending") {
    inner = (
      <Center>
        <Loader />
      </Center>
    );
  } else if (feedsQuery.status === "error") {
    inner = (
      <Center>
        <Alert color="red">
          Unable to load feeds: {String(feedsQuery.error)}
        </Alert>
      </Center>
    );
  } else {
    inner = <InnerContent feeds={feedsQuery.data} />;
  }

  return (
    <Container size="md" mt="xl">
      {inner}
    </Container>
  );
};

const InnerContent = ({ feeds }: { feeds: Feed[] }) => {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    feedId: string | null;
  }>({ isOpen: false, feedId: null });
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      feedUrl: "",
      autoAdd: false,
    },
    validate: {
      feedUrl: (value) => (value.length < 3 ? "URL is required" : null),
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const formData = new FormData();
      formData.append("url", values.feedUrl);
      formData.append("auto_add_items", values.autoAdd.toString());
      return await pb.send("/lynx/parse_feed", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      close();
      form.reset();
      notifications.show({
        message: "Feed added successfully",
        color: "green",
      });
    },
    onError: (error) => {
      console.error("Error adding feed:", error);
      notifications.show({
        message: "Failed to add feed. Please try again.",
        color: "red",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      feedId,
      currentValue,
    }: {
      feedId: string;
      currentValue: boolean;
    }) => {
      return await pb.collection("feeds").update(feedId, {
        auto_add_feed_items_to_library: !currentValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      notifications.show({
        message: "Feed updated successfully",
        color: "green",
      });
    },
    onError: (error) => {
      console.error("Error updating feed:", error);
      notifications.show({
        message: "Failed to update feed. Please try again.",
        color: "red",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ feedId }: { feedId: string }) => {
      return await pb.collection("feeds").delete(feedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      setDeleteConfirmation({ isOpen: false, feedId: null });
      notifications.show({
        message: "Feed deleted successfully",
        color: "green",
      });
    },
    onError: (error) => {
      console.error("Error deleting feed:", error);
      notifications.show({
        message: "Failed to delete feed. Please try again.",
        color: "red",
      });
    },
  });

  const FeedCard: React.FC<{ feed: Feed }> = ({ feed }) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
      <Group justify="space-between">
        <Group>
          <img
            src={feed.image_url || "/img/lynx_placeholder.png"}
            alt={feed.name}
            style={{ width: 50, height: 50, borderRadius: 8 }}
          />
          <div>
            <Text fw={500}>{feed.name}</Text>
            <Text size="sm" c="dimmed">
              {feed.feed_url}
            </Text>
          </div>
        </Group>
        <Group>
          <Switch
            checked={feed.auto_add_feed_items_to_library}
            onChange={() =>
              toggleMutation.mutate({
                feedId: feed.id,
                currentValue: feed.auto_add_feed_items_to_library,
              })
            }
            label="Auto-add"
          />
          <Menu withinPortal position="bottom-end" shadow="sm" zIndex={50}>
            <Menu.Target>
              <ActionIcon>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={14} />}
                component={Link}
                to={URLS.FEED_ITEMS(feed.id)}
              >
                View Items
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() =>
                  setDeleteConfirmation({ isOpen: true, feedId: feed.id })
                }
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      <Text size="sm" mt="sm">
        {feed.description}
      </Text>
      <Text size="xs" c="dimmed" mt="sm">
        Last fetched: {new Date(feed.last_fetched_at).toLocaleString()}
      </Text>
    </Card>
  );

  return (
    <Container size="md" mt="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>RSS Feeds</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={open}>
          Add Feed
        </Button>
      </Group>

      {feeds.map((feed) => (
        <FeedCard key={feed.id} feed={feed} />
      ))}

      <DrawerDialog open={opened} onClose={close} title="Add New RSS Feed">
        <form onSubmit={form.onSubmit(addMutation.mutate as any)}>
          <TextInput
            required
            label="Feed URL"
            placeholder="https://example.com/feed"
            size="md"
            {...form.getInputProps("feedUrl")}
          />
          <Switch
            label="Automatically add new feed items to library"
            {...form.getInputProps("autoAdd", { type: "checkbox" })}
            mt="md"
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Add Feed</Button>
          </Group>
        </form>
      </DrawerDialog>

      <DrawerDialog
        open={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, feedId: null })}
        title="Confirm Deletion"
      >
        <Text>
          Are you sure you want to delete this feed? This action cannot be
          undone.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button
            variant="outline"
            onClick={() =>
              setDeleteConfirmation({ isOpen: false, feedId: null })
            }
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() =>
              deleteConfirmation.feedId &&
              deleteMutation.mutate({ feedId: deleteConfirmation.feedId })
            }
          >
            Delete
          </Button>
        </Group>
      </DrawerDialog>
    </Container>
  );
};

export default Feeds;
