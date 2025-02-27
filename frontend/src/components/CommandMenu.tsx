import { useMemo, useState } from "react";
import { rem } from "@mantine/core";
import {
  Spotlight,
  SpotlightActionGroupData,
  SpotlightActionData,
} from "@mantine/spotlight";
import {
  IconBlockquote,
  IconHome,
  IconRss,
  IconSettings,
  IconSearch,
  IconStar,
  IconCookie,
  IconKey,
  IconPlus,
  IconTag,
  IconCircle,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import URLS from "@/lib/urls";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import useAllUserFeeds from "@/hooks/useAllUserFeeds";

const BASE_ACTIONS = [
  {
    label: "Add Link",
    description: "Add a new link",
    url: URLS.ADD_LINK,
    icon: IconPlus,
  },
  {
    label: "Home",
    description: "Go to the home page",
    url: URLS.HOME,
    icon: IconHome,
  },
  {
    label: "Favorites",
    description: "Re-read your favorite links",
    url: URLS.FAVORITES,
    icon: IconStar,
  },
  {
    label: "Unread",
    description: "View unread links",
    url: URLS.HOME_WITH_UNREAD_LINKS,
    icon: IconCircle,
  },
  {
    label: "Feeds",
    description: "Manage your feeds",
    url: URLS.FEEDS,
    icon: IconRss,
  },
  {
    label: "Highlights",
    description: "Review saved highlights",
    url: URLS.HIGHLIGHTS,
    icon: IconBlockquote,
  },
  {
    label: "Settings",
    description: "Adjust your account settings",
    url: URLS.SETTINGS,
    icon: IconSettings,
  },
  {
    label: "Cookies",
    description: "Manage your stored cookies",
    url: URLS.COOKIES,
    icon: IconCookie,
  },
  {
    label: "API Keys",
    description: "Manage your API keys",
    url: URLS.API_KEYS,
    icon: IconKey,
  },
];

const LynxCommandMenu = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const tagsQuery = useAllUserTagsWithoutMetadata();
  const feedsQuery = useAllUserFeeds();
  const navigateAndClear = useMemo(
    () => (url: string) => {
      navigate(url);
      setQuery("");
    },
    [navigate, setQuery],
  );

  const pageTagFeedActions: (SpotlightActionGroupData | SpotlightActionData)[] =
    useMemo(() => {
      const baseActions: (SpotlightActionGroupData | SpotlightActionData)[] = [
        {
          group: "Pages",
          actions: BASE_ACTIONS.map((action) => ({
            id: action.label,
            label: action.label,
            description: action.description,
            onClick: () => navigateAndClear(action.url),
            leftSection: (
              <action.icon
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          })),
        },
      ];

      if (feedsQuery.status === "success") {
        const { data: feeds } = feedsQuery;
        baseActions.push({
          group: "Feeds",
          actions: feeds.map((feed) => ({
            id: `feed-${feed.id}`,
            label: feed.name,
            onClick: () =>
              navigateAndClear(URLS.HOME_WITH_FEED_SEARCH(feed.id)),
            leftSection: (
              <IconRss
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          })),
        });
      }
      if (tagsQuery.status === "success") {
        const { data: tags } = tagsQuery;
        baseActions.push({
          group: "Tags",
          actions: tags.map((tag) => ({
            id: `tag-${tag.id}`,
            label: tag.name,
            onClick: () => navigateAndClear(URLS.HOME_WITH_TAGS_SEARCH(tag.id)),
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
    }, [tagsQuery, navigateAndClear, feedsQuery]);

  const searchAction = {
    id: "search",
    label: `Search for "${query}"`,
    description: "Search for links",
    onClick: () => navigateAndClear(URLS.HOME_WITH_SEARCH_STRING(query)),
    leftSection: (
      <IconSearch style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
    ),
  };
  return (
    <Spotlight
      actions={
        query !== ""
          ? [...pageTagFeedActions, searchAction]
          : pageTagFeedActions
      }
      nothingFound="Nothing found..."
      query={query}
      onQueryChange={setQuery}
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
