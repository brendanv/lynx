import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import useAllUserFeeds from "@/hooks/useAllUserFeeds";
import { Button, Menu, TextInput } from "@mantine/core";
import {
  IconCheck,
  IconFilter,
  IconRss,
  IconSortAscending,
  IconTag,
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
  const { feeds } = useAllUserFeeds();

  const updateSearchParams = (newParams: Partial<SearchParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    onSearchParamsChange(updatedParams);
  };

  const readStates = [
    { value: "all", label: "All" },
    { value: "read", label: "Read" },
    { value: "unread", label: "Unread" },
  ];

  const sortOptions = [
    { value: "added_to_library", label: "Date Added" },
    { value: "article_date", label: "Article Date" },
  ];

  return (
    <div className={classes.searchBar}>
      <TextInput
        placeholder="Search..."
        value={searchParams.searchText}
        onChange={(e) => updateSearchParams({ searchText: e.target.value })}
        size="md"
      />
      <Menu>
        <Menu.Target>
          <Button
            variant={searchParams.readState === "all" ? "default" : "filled"}
            size="md"
          >
            <IconFilter />
          </Button>
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
          <Button
            variant={
              searchParams.sortBy === "added_to_library" ? "default" : "filled"
            }
            size="md"
          >
            <IconSortAscending />
          </Button>
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
          <Button variant={searchParams.tagId ? "filled" : "default"} size="md">
            <IconTag />
          </Button>
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
          <Button
            variant={searchParams.feedId ? "filled" : "default"}
            size="md"
          >
            <IconRss />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
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
                  feedId: searchParams.feedId === feed.id ? undefined : feed.id,
                })
              }
            >
              {feed.name}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
};

export default SearchBar;
