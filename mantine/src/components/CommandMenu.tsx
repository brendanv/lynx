import { useMemo } from "react";
import { rem } from "@mantine/core";
import {
  Spotlight,
  SpotlightActionGroupData,
  SpotlightActionData,
} from "@mantine/spotlight";
import {
  IconHome,
  IconRss,
  IconSettings,
  IconSearch,
  IconCookie,
  IconKey,
  IconPlus,
  IconTag,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import URLS from "@/lib/urls";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import useAllUserFeeds from "@/hooks/useAllUserFeeds";

const LynxCommandMenu = () => {
  const navigate = useNavigate();

  const {
    tags,
    loading: tagsLoading,
    error: tagsError,
  } = useAllUserTagsWithoutMetadata();
  const { feeds, loading: feedsLoading, error: feedsError } = useAllUserFeeds();

  const actions: (SpotlightActionGroupData | SpotlightActionData)[] =
    useMemo(() => {
      const baseActions: (SpotlightActionGroupData | SpotlightActionData)[] = [
        {
          group: "Pages",
          actions: [
            {
              id: "home",
              label: "Home",
              description: "Go to the home page",
              onClick: () => navigate(URLS.HOME),
              leftSection: (
                <IconHome
                  style={{ width: rem(24), height: rem(24) }}
                  stroke={1.5}
                />
              ),
            },
            {
              id: "feeds",
              label: "Feeds",
              description: "Manage your feeds",
              onClick: () => navigate(URLS.FEEDS),
              leftSection: (
                <IconRss
                  style={{ width: rem(24), height: rem(24) }}
                  stroke={1.5}
                />
              ),
            },
            {
              id: "settings",
              label: "Settings",
              description: "Adjust your account settings",
              onClick: () => navigate(URLS.SETTINGS),
              leftSection: (
                <IconSettings
                  style={{ width: rem(24), height: rem(24) }}
                  stroke={1.5}
                />
              ),
            },
            {
              id: "cookies",
              label: "Cookies",
              description: "Manage your stored cookies",
              onClick: () => navigate(URLS.COOKIES),
              leftSection: (
                <IconCookie
                  style={{ width: rem(24), height: rem(24) }}
                  stroke={1.5}
                />
              ),
            },
            {
              id: "api-keys",
              label: "API Keys",
              description: "Manage your API keys",
              onClick: () => navigate(URLS.API_KEYS),
              leftSection: (
                <IconKey
                  style={{ width: rem(24), height: rem(24) }}
                  stroke={1.5}
                />
              ),
            },
            {
              id: "add-link",
              label: "Add Link",
              description: "Add a new link",
              onClick: () => navigate(URLS.ADD_LINK),
              leftSection: (
                <IconPlus
                  style={{ width: rem(24), height: rem(24) }}
                  stroke={1.5}
                />
              ),
            },
          ],
        },
      ];

      if (!feedsLoading && !feedsError && feeds.length > 0) {
        baseActions.push({
          group: "Feeds",
          actions: feeds.map((feed) => ({
            id: `feed-${feed.id}`,
            label: feed.name,
            // description: "View links for feed",
            onClick: () => navigate(URLS.HOME_WITH_FEED_SEARCH(feed.id)),
            leftSection: (
              <IconRss
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          })),
        });
      }
      if (!tagsLoading && !tagsError && tags.length > 0) {
        baseActions.push({
          group: "Tags",
          actions: tags.map((tag) => ({
            id: `tag-${tag.id}`,
            label: tag.name,
            // description: `View links with tag: ${tag.name}`,
            onClick: () => navigate(URLS.HOME_WITH_TAGS_SEARCH(tag.id)),
            leftSection: (
              <IconTag
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          })),
        });
      }
      return baseActions;
    }, [
      feeds,
      tags,
      feedsLoading,
      tagsLoading,
      feedsError,
      tagsError,
      navigate,
    ]);

  return (
    <Spotlight
      actions={actions}
      nothingFound="Nothing found..."
      highlightQuery
      scrollable
      maxHeight={400}
      searchProps={{
        leftSection: (
          <IconSearch
            style={{ width: rem(20), height: rem(20) }}
            stroke={1.5}
          />
        ),
        placeholder: "Search...",
      }}
    />
  );
};

export default LynxCommandMenu;
