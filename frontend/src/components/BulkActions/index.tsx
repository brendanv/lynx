import React from "react";
import { Button, Group, Menu } from "@mantine/core";
import {
  IconTags,
  IconCircleCheck,
  IconCircle,
  IconStar,
  IconStarOff,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useInvalidateLinksFeed } from "@/hooks/useLinksFeedQuery";
import { useDisclosure } from "@mantine/hooks";
import type FeedLink from "@/types/FeedLink";
import { GenericLynxMutator } from "@/types/Mutations";
import DrawerDialog from "@/components/DrawerDialog";
import BulkTagsEditor from "./BulkTagsEditor";

interface BulkActionsProps {
  selectionMode: boolean;
  selectedItems: Set<string>;
  toggleSelectionMode: () => void;
  clearSelection: () => void;
  linkMutator: GenericLynxMutator<FeedLink>;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectionMode,
  selectedItems,
  toggleSelectionMode,
  clearSelection,
  linkMutator,
}) => {
  const invalidateLinksFeed = useInvalidateLinksFeed();
  const [isTagsDrawerOpen, { open: openTagsDrawer, close: closeTagsDrawer }] =
    useDisclosure(false);

  const handleBulkUpdate = async (
    updates: Record<string, any>,
    successMessage: string,
    errorMessage: string,
  ) => {
    try {
      const promises = Array.from(selectedItems).map((id) =>
        linkMutator.mutate({
          id,
          updates,
          options: {
            onErrorMessage: errorMessage,
          },
        }),
      );
      await Promise.all(promises);
      await invalidateLinksFeed();
      notifications.show({ title: "Success", message: successMessage });
      clearSelection();
    } catch (error) {
      console.error("Error performing bulk update:", error);
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  const handleBulkMarkAsRead = () =>
    handleBulkUpdate(
      { last_viewed_at: new Date().toISOString() },
      "Items marked as read",
      "Failed to mark items as read",
    );

  const handleBulkMarkAsUnread = () =>
    handleBulkUpdate(
      { last_viewed_at: null },
      "Items marked as unread",
      "Failed to mark items as unread",
    );

  const handleBulkAddToFavorites = () =>
    handleBulkUpdate(
      { starred_at: new Date().toISOString() },
      "Items added to favorites",
      "Failed to add items to favorites",
    );

  const handleBulkRemoveFromFavorites = () =>
    handleBulkUpdate(
      { starred_at: null },
      "Items removed from favorites",
      "Failed to remove items from favorites",
    );

  const handleTagsComplete = () => {
    closeTagsDrawer();
    clearSelection();
  };

  return (
    <>
      <Group grow>
        {selectionMode && (
          <Button variant="outline" onClick={toggleSelectionMode}>
            Clear Selection
          </Button>
        )}

        {selectionMode && selectedItems.size > 0 && (
          <Menu>
            <Menu.Target>
              <Button>Edit ({selectedItems.size})</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Reading Status</Menu.Label>
              <Menu.Item
                leftSection={<IconCircleCheck size={14} />}
                onClick={handleBulkMarkAsRead}
              >
                Mark as Read
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCircle size={14} />}
                onClick={handleBulkMarkAsUnread}
              >
                Mark as Unread
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>Favorites</Menu.Label>
              <Menu.Item
                leftSection={<IconStar size={14} />}
                onClick={handleBulkAddToFavorites}
              >
                Add to Favorites
              </Menu.Item>
              <Menu.Item
                leftSection={<IconStarOff size={14} />}
                onClick={handleBulkRemoveFromFavorites}
              >
                Remove from Favorites
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>Organization</Menu.Label>
              <Menu.Item
                leftSection={<IconTags size={14} />}
                onClick={openTagsDrawer}
              >
                Edit Tags
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <DrawerDialog
        title={`Edit Tags for ${selectedItems.size} Items`}
        open={isTagsDrawerOpen}
        onClose={closeTagsDrawer}
      >
        <BulkTagsEditor
          selectedItems={selectedItems}
          onComplete={handleTagsComplete}
        />
      </DrawerDialog>
    </>
  );
};

export default BulkActions;
