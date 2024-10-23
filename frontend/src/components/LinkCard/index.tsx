import React from "react";
import {
  ActionIcon,
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
  IconBlockquote,
  IconCircle,
  IconCircleCheck,
  IconDotsVertical,
  IconFileDownload,
  IconPencil,
  IconTrash,
  IconTags,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import LinkTagsDisplay from "@/components/LinkTagsDisplay";
import { GenericLynxMutator } from "@/types/Mutations";
import { useInvalidateLinksFeed } from "@/hooks/useLinksFeedQuery";
import { useMutation } from "@tanstack/react-query";
import BackgroundImage from "./BackgroundImage";
import DrawerDialog from "@/components/DrawerDialog";
import TagsEditor from "@/components/TagsEditor";

interface Props {
  link: FeedLink;
  linkMutator: GenericLynxMutator<FeedLink>;
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

const LinkCard = ({ link, linkMutator }: Props) => {
  const { pb } = usePocketBase();
  const invalidateLinksFeed = useInvalidateLinksFeed();
  const [isTagsEditOpen, { open: openTagsEdit, close: closeTagsEdit }] =
    useDisclosure(false);

  const isUnread = link.last_viewed_at === null;
  const handleToggleUnread = async () => {
    linkMutator.mutate({
      id: link.id,
      updates: {
        last_viewed_at: isUnread ? new Date().toISOString() : null,
      },
      options: {
        onSuccessMessage: `Marked as ${isUnread ? "read" : "unread"}`,
        onErrorMessage: "Failed to update link status",
      },
    });
  };
  const deleteMutator = useMutation({
    mutationFn: async () => {
      await pb.collection("links").delete(link.id);
    },
    onSuccess: async () => {
      notifications.show({
        title: "Link deleted",
        message: "The link has been removed from your library",
      });
      await invalidateLinksFeed();
    },
    onError: (error) => {
      console.error("Error deleting link:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete link",
        color: "red",
      });
    },
  });

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
    <>
      <Indicator disabled={!isUnread} position="top-start" withBorder size={15}>
        <Card withBorder padding="lg" radius="md" className={classes.card}>
          <Card.Section mb="sm">
            <BackgroundImage
              linkId={link.id}
              imgSrc={link.header_image_url}
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
                      leftSection={
                        <IconTags className={dropdownClasses.dropdownIcon} />
                      }
                      onClick={openTagsEdit}
                    >
                      Tags
                    </Menu.Item>
                    <Menu.Item
                      leftSection={
                        <IconBlockquote
                          className={dropdownClasses.dropdownIcon}
                        />
                      }
                      component={Link}
                      to={URLS.HIGHLIGHTS_WITH_LINK_SEARCH(link.id)}
                    >
                      View Highlights
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
                      onClick={() => deleteMutator.mutate()}
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
              <LinkTagsDisplay link={link} size="xs" />
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
      <DrawerDialog title="Edit Tags" open={isTagsEditOpen} onClose={closeTagsEdit}>
        <TagsEditor link={link} linkMutator={linkMutator} afterSave={closeTagsEdit} />
      </DrawerDialog>
    </>
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
