import React from "react";
import {
  ActionIcon,
  BackgroundImage,
  Card,
  Divider,
  Group,
  Indicator,
  Menu,
  rem,
  Skeleton,
  Text,
} from "@mantine/core";
import type FeedLink from "@/types/FeedLink";
import classes from "./LinkCard.module.css";
import dropdownClasses from "@/components/SharedCSS/DropdownIcon.module.css";
import URLS from "@/lib/urls";
import {
  IconArchive,
  IconCircle,
  IconCircleCheck,
  IconDotsVertical,
  IconFileDownload,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { usePocketBase } from "@/hooks/usePocketBase";
import { notifications } from "@mantine/notifications";
import LinkTagsDisplay from "@/components/LinkTagsDisplay";

interface Props {
  link: FeedLink;
  onUpdate: (() => Promise<void>) | null;
}
const MetadataRow = ({ link }: { link: FeedLink }) => {
  const formattedDate = link.article_date?.toLocaleDateString("en-US", {
    year: "numeric" as const,
    month: "short" as const,
    day: "numeric" as const,
  });
  const items: React.ReactNode[] = [
    formattedDate,
    <span key="hostname" className={classes.hostname}>
      {link.hostname}
    </span>,
    link.read_time_display,
  ].filter(Boolean);
  const itemsWithDividers = items.reduce(
    (acc: any, item, index) =>
      index === items.length - 1
        ? [...acc, item]
        : [
            ...acc,
            item,
            <Divider key={`divider-${index}`} orientation="vertical" />,
          ],
    [],
  );
  return <div className={classes.metadata}>{itemsWithDividers}</div>;
};
const LinkCard = ({ link, onUpdate }: Props) => {
  const { pb } = usePocketBase();

  const isUnread = link.last_viewed_at === null;
  const handleToggleUnread = async () => {
    try {
      const updatedLink = {
        ...link,
        last_viewed_at: isUnread ? new Date().toISOString() : null,
      };
      await pb.collection("links").update(link.id, updatedLink);
      notifications.show({
        title: "Link updated",
        message: `Marked as ${isUnread ? "read" : "unread"}`,
      });
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error("Error toggling unread status:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update link status",
        color: "red",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection("links").delete(link.id);
      notifications.show({
        title: "Link deleted",
        message: "The link has been removed from your library",
      });
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error("Error deleting link:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete link",
        color: "red",
      });
    }
  };
  const handleCreateArchive = async () => {
    try {
      await pb.send(`/lynx/link/${link.id}/create_archive`, {
        method: "POST",
      });
      notifications.show({
        message: "Attempting to create archive...",
      });
    } catch (error) {
      console.error("Error creating archive:", error);
      notifications.show({
        title: "Error",
        message: "Failed to create archive",
        color: "red",
      });
    }
  };

  return (
    <Indicator disabled={!isUnread} position="top-start" withBorder size={15}>
      <Card withBorder padding="lg" radius="md" className={classes.card}>
        <Card.Section mb="sm">
          <BackgroundImage
            className={classes.headerImage}
            src={link.header_image_url || "/img/lynx_placeholder.png"}
          >
            <Group justify="flex-end" p="xs">
              <Menu zIndex={50}>
                <Menu.Target>
                  <ActionIcon variant="subtle">
                    <IconDotsVertical />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Link</Menu.Label>
                  <Menu.Item
                    leftSection={
                      <IconPencil className={dropdownClasses.dropdownIcon} />
                    }
                    component="a"
                    href={URLS.EDIT_LINK(link.id)}
                  >
                    Edit Link
                  </Menu.Item>
                  <Menu.Item
                    onClick={handleToggleUnread}
                    leftSection={
                      isUnread ? (
                        <IconCircleCheck
                          className={dropdownClasses.dropdownIcon}
                        />
                      ) : (
                        <IconCircle className={dropdownClasses.dropdownIcon} />
                      )
                    }
                  >
                    {isUnread ? "Mark as Read" : "Mark as Unread"}
                  </Menu.Item>
                  {link.archive ? (
                    <Menu.Item
                      leftSection={
                        <IconArchive className={dropdownClasses.dropdownIcon} />
                      }
                      component="a"
                      href={URLS.LINK_ARCHIVE(link.id)}
                    >
                      View Archive
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      onClick={handleCreateArchive}
                      leftSection={
                        <IconFileDownload
                          className={dropdownClasses.dropdownIcon}
                        />
                      }
                    >
                      Create Archive
                    </Menu.Item>
                  )}
                  <Menu.Label>Danger Zone</Menu.Label>
                  <Menu.Item
                    onClick={handleDelete}
                    leftSection={
                      <IconTrash className={dropdownClasses.dropdownIcon} />
                    }
                    color="red"
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </BackgroundImage>
        </Card.Section>
        {link.tags.length > 0 ? (
          <div className={classes.tags}>
            <LinkTagsDisplay
              link={link}
              size="xs"
            />
          </div>
        ) : null}

        <Text
          className={[classes.title, classes.clamp].join(" ")}
          component="a"
          href={URLS.LINK_VIEWER(link.id)}
        >
          {link.title}
        </Text>
        <Text
          className={classes.clamp}
          component="a"
          href={URLS.LINK_VIEWER(link.id)}
        >
          {link.excerpt}
        </Text>

        <Card.Section className={classes.footer}>
          <MetadataRow link={link} />
        </Card.Section>
      </Card>
    </Indicator>
  );
};

export const LinkCardSkeleton = () => {
  return (
    <Card withBorder radius="md" className={classes.card}>
      <Card.Section mb="sm">
        <Skeleton className={classes.headerImage} />
      </Card.Section>
      <div className={classes.skeletons}>
        <Skeleton width="45%" height={rem("1.5rem")} />
        <Skeleton width="90%" height={rem("1rem")} />
        <Skeleton width="90%" height={rem("1rem")} />
      </div>
    </Card>
  );
};

export default LinkCard;
