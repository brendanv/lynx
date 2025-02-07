import React from "react";
import {
  ActionIcon,
  Card,
  Divider,
  Group,
  Indicator,
  Menu,
  Progress,
  rem,
  Skeleton,
  Text,
  Tooltip,
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
  IconFileTextAi,
  IconPencil,
  IconStar,
  IconStarFilled,
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
  const [isSummaryOpen, { open: openSummary, close: closeSummary }] =
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
  const isStarred = link.starred_at !== null;
  const handleToggleStarred = async () => {
    linkMutator.mutate({
      id: link.id,
      updates: {
        starred_at: isStarred ? null : new Date().toISOString(),
      },
      options: {
        onSuccessMessage: `${isStarred ? "Removed from" : "Added to"} favorites`,
        onErrorMessage: "Failed to update favorite status",
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
            <BackgroundImage linkId={link.id} imgSrc={link.header_image_url}>
              <Group justify="flex-end" p="xs">
                <ActionIcon.Group>
                  <Tooltip
                    label={
                      isStarred ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    <ActionIcon
                      variant="light"
                      onClick={handleToggleStarred}
                      title={
                        isStarred ? "Remove from favorites" : "Add to favorites"
                      }
                    >
                      {isStarred ? <IconStarFilled /> : <IconStar />}
                    </ActionIcon>
                  </Tooltip>
                  {link.summary ? (
                    <Tooltip label="View Summary">
                      <ActionIcon
                        variant="light"
                        onClick={openSummary}
                        title="View Summary"
                      >
                        <IconFileTextAi />
                      </ActionIcon>
                    </Tooltip>
                  ) : null}
                  <Tooltip label="Edit Tags">
                    <ActionIcon
                      variant="light"
                      onClick={openTagsEdit}
                      title="Edit Tags"
                    >
                      <IconTags />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={isUnread ? "Mark as Read" : "Mark as Unread"}>
                    <ActionIcon
                      variant="light"
                      onClick={handleToggleUnread}
                      title={isUnread ? "Mark as Read" : "Mark as Unread"}
                    >
                      {isUnread ? <IconCircle /> : <IconCircleCheck />}
                    </ActionIcon>
                  </Tooltip>
                  <Menu zIndex={50}>
                    <Menu.Target>
                      <ActionIcon variant="light">
                        <IconDotsVertical />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Link</Menu.Label>
                      <Menu.Item
                        leftSection={
                          <IconPencil
                            className={dropdownClasses.dropdownIcon}
                          />
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
                            <IconCircle
                              className={dropdownClasses.dropdownIcon}
                            />
                          )
                        }
                      >
                        {isUnread ? "Mark as Read" : "Mark as Unread"}
                      </Menu.Item>
                      {link.archive ? (
                        <Menu.Item
                          leftSection={
                            <IconArchive
                              className={dropdownClasses.dropdownIcon}
                            />
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
                </ActionIcon.Group>
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
          {link.reading_progress ? (
            <Card.Section>
              <Progress
                value={link.reading_progress * 100.0}
                size="xs"
                radius={0}
                styles={{
                  root: {
                    backgroundColor: "transparent",
                  },
                }}
              />
            </Card.Section>
          ) : null}
        </Card>
      </Indicator>
      <DrawerDialog
        title="Edit Tags"
        open={isTagsEditOpen}
        onClose={closeTagsEdit}
      >
        <TagsEditor
          link={link}
          linkMutator={linkMutator}
          afterSave={closeTagsEdit}
        />
      </DrawerDialog>
      <DrawerDialog
        title={`Summary for ${link.title}`}
        open={isSummaryOpen}
        onClose={closeSummary}
      >
        <pre className={classes.summaryPre}>{link.summary}</pre>
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
