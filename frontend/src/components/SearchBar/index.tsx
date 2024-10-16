import { useCallback } from "react";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import useAllUserFeeds from "@/hooks/useAllUserFeeds";
import { ActionIcon, Badge, Menu, TextInput, rem } from "@mantine/core";
import {
  IconCheck,
  IconFilter,
  IconRss,
  IconSortAscending,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import dropdownClasses from "@/components/SharedCSS/DropdownIcon.module.css";
import classes from "./SearchBar.module.css";

export type SearchParams = {
  searchText: string;
  readState: "all" | "read" | "unread";
  tagId?: string;
  feedId?: string;
  sortBy: "added_to_library" | "article_date";
};

type SearchBarProps = {
  searchParams: SearchParams;
  onSearchParamsChange: (params: SearchParams) => void;
};

const SearchBar = ({ searchParams, onSearchParamsChange }: SearchBarProps) => {
  const { tags } = useAllUserTagsWithoutMetadata();
  const feedsQuery = useAllUserFeeds();
  const feeds = feedsQuery.status === "success" ? feedsQuery.data : [];
  const updateSearchParams = (newParams: Partial<SearchParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    onSearchParamsChange(updatedParams);
  };

  const clearSearchParams = useCallback(() => {
    updateSearchParams({
      searchText: "",
      readState: "all",
      tagId: undefined,
      feedId: undefined,
      sortBy: "added_to_library",
    });
  }, [updateSearchParams]);

  const readStates = [
    { value: "all", label: "All" },
    { value: "read", label: "Read" },
    { value: "unread", label: "Unread" },
  ];

  const sortOptions = [
    { value: "added_to_library", label: "Date Added" },
    { value: "article_date", label: "Article Date" },
  ];

  const selectedFilters: string[] = [];
  if (searchParams.readState !== "all") {
    selectedFilters.push(`${searchParams.readState} only`);
  }
  if (searchParams.tagId) {
    selectedFilters.push(
      `Tagged with: ${tags.find((t) => t.id === searchParams.tagId)?.name}`,
    );
  }
  if (searchParams.feedId) {
    selectedFilters.push(
      `From: ${feeds.find((f) => f.id === searchParams.feedId)?.name}`,
    );
  }
  if (searchParams.searchText) {
    selectedFilters.push(`Searching for: "${searchParams.searchText}"`);
  }

  return (
    <div className={classes.searchWrapper}>
      <div className={classes.searchBar}>
        <TextInput
          placeholder="Search..."
          value={searchParams.searchText}
          onChange={(e) => updateSearchParams({ searchText: e.target.value })}
          size="md"
        />
        <ActionIcon.Group>
          <Menu>
            <Menu.Target>
              <ActionIcon
                variant={
                  searchParams.readState === "all" ? "default" : "filled"
                }
                className={classes.actionIcon}
              >
                <IconFilter />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Read State</Menu.Label>
              {readStates.map(({ value, label }) => (
                <Menu.Item
                  key={value}
                  leftSection={
                    searchParams.readState === value ? (
                      <IconCheck className={dropdownClasses.dropdownIcon} />
                    ) : (
                      <span className={dropdownClasses.dropdownIcon} />
                    )
                  }
                  onClick={() =>
                    updateSearchParams({
                      readState: value as "all" | "read" | "unread",
                    })
                  }
                >
                  {label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <Menu>
            <Menu.Target>
              <ActionIcon
                variant={
                  searchParams.sortBy === "added_to_library"
                    ? "default"
                    : "filled"
                }
                className={classes.actionIcon}
              >
                <IconSortAscending />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Sort By</Menu.Label>
              {sortOptions.map(({ value, label }) => (
                <Menu.Item
                  key={value}
                  leftSection={
                    searchParams.sortBy === value ? (
                      <IconCheck className={dropdownClasses.dropdownIcon} />
                    ) : (
                      <span className={dropdownClasses.dropdownIcon} />
                    )
                  }
                  onClick={() =>
                    updateSearchParams({
                      sortBy: value as "added_to_library" | "article_date",
                    })
                  }
                >
                  {label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <Menu>
            <Menu.Target>
              <ActionIcon
                variant={searchParams.tagId ? "filled" : "default"}
                className={classes.actionIcon}
              >
                <IconTag />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {tags.length === 0 ? <Menu.Label>No tags</Menu.Label> : null}
              {tags.map((tag) => (
                <Menu.Item
                  key={tag.id}
                  leftSection={
                    searchParams.tagId === tag.id ? (
                      <IconCheck className={dropdownClasses.dropdownIcon} />
                    ) : (
                      <span className={dropdownClasses.dropdownIcon} />
                    )
                  }
                  onClick={() =>
                    updateSearchParams({
                      tagId: searchParams.tagId === tag.id ? undefined : tag.id,
                    })
                  }
                >
                  {tag.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <Menu>
            <Menu.Target>
              <ActionIcon
                variant={searchParams.feedId ? "filled" : "default"}
                className={classes.actionIcon}
              >
                <IconRss />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {feeds.length === 0 ? <Menu.Label>No feeds</Menu.Label> : null}
              {feeds.map((feed) => (
                <Menu.Item
                  key={feed.id}
                  leftSection={
                    searchParams.feedId === feed.id ? (
                      <IconCheck className={dropdownClasses.dropdownIcon} />
                    ) : (
                      <span className={dropdownClasses.dropdownIcon} />
                    )
                  }
                  onClick={() =>
                    updateSearchParams({
                      feedId:
                        searchParams.feedId === feed.id ? undefined : feed.id,
                    })
                  }
                >
                  {feed.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </ActionIcon.Group>
      </div>
      {selectedFilters.length > 0 && (
        <div className={classes.selectedFilters}>
          {selectedFilters.map((f) => (
            <Badge variant="light" key={f}>
              {f}
            </Badge>
          ))}
          <Badge
            leftSection={<IconX height={rem(12)} width={rem(12)} />}
            variant="light"
            onClick={clearSearchParams}
            color="red"
          >
            Clear Filters
          </Badge>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
