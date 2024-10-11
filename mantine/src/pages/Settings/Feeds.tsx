import React, { useState } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import {
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
  Modal,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconDots,
  IconEye,
  IconTrash,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import URLS from "@/lib/urls";
import useAllUserFeeds from "@/hooks/useAllUserFeeds";

type Feed = {
  id: string;
  name: string;
  feed_url: string;
  description: string;
  image_url: string;
  auto_add_feed_items_to_library: boolean;
  last_fetched_at: string;
};

const Feeds: React.FC = () => {
  const { pb } = usePocketBase();
  const { feeds, loading, error, refetch } = useAllUserFeeds();
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

  const handleAddFeed = async (values: typeof form.values) => {
    try {
      const formData = new FormData();
      formData.append("url", values.feedUrl);
      formData.append("auto_add_items", values.autoAdd.toString());
      await pb.send("/lynx/parse_feed", { method: "POST", body: formData });
      await refetch();
      close();
      form.reset();
      notifications.show({
        message: "Feed added successfully",
        color: "green",
      });
    } catch (err) {
      console.error("Error adding feed:", err);
      notifications.show({
        message: "Failed to add feed. Please try again.",
        color: "red",
      });
    }
  };

  const handleToggleAutoAdd = async (id: string, currentValue: boolean) => {
    try {
      await pb.collection("feeds").update(id, {
        auto_add_feed_items_to_library: !currentValue,
      });
      await refetch();
      notifications.show({
        message: "Feed updated successfully",
        color: "green",
      });
    } catch (err) {
      console.error("Error updating feed:", err);
      notifications.show({
        message: "Failed to update feed. Please try again.",
        color: "red",
      });
    }
  };

  const handleDeleteFeed = async () => {
    if (deleteConfirmation.feedId) {
      try {
        await pb.collection("feeds").delete(deleteConfirmation.feedId);
        await refetch();
        setDeleteConfirmation({ isOpen: false, feedId: null });
        notifications.show({
          message: "Feed deleted successfully",
          color: "green",
        });
      } catch (err) {
        console.error("Error deleting feed:", err);
        notifications.show({
          message: "Failed to delete feed. Please try again.",
          color: "red",
        });
      }
    }
  };

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
              handleToggleAutoAdd(feed.id, feed.auto_add_feed_items_to_library)
            }
            label="Auto-add"
          />
          <Menu withinPortal position="bottom-end" shadow="sm">
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

      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      {loading ? (
        <Loader />
      ) : (
        feeds.map((feed) => <FeedCard key={feed.id} feed={feed} />)
      )}

      <Modal opened={opened} onClose={close} title="Add New RSS Feed">
        <form onSubmit={form.onSubmit(handleAddFeed)}>
          <TextInput
            required
            label="Feed URL"
            placeholder="https://example.com/feed"
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
      </Modal>

      <Modal
        opened={deleteConfirmation.isOpen}
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
          <Button color="red" onClick={handleDeleteFeed}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default Feeds;