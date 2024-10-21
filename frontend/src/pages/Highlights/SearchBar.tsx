import { useCallback } from "react";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import { ActionIcon, Badge, Menu, TextInput, rem } from "@mantine/core";
import {
  IconCheck,
  IconSortAscending,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import dropdownClasses from "@/components/SharedCSS/DropdownIcon.module.css";
import classes from "./SearchBar.module.css";
import { usePocketBase } from "@/hooks/usePocketBase";
import { useQuery } from "@tanstack/react-query";

export type SearchParams = {
  searchText: string;
  tagId?: string;
  linkId?: string;
  sort: "oldest_first" | "newest_first";
};

type SearchBarProps = {
  searchParams: SearchParams;
  onSearchParamsChange: (params: SearchParams) => void;
};

const SearchBar = ({ searchParams, onSearchParamsChange }: SearchBarProps) => {
  const { pb, user } = usePocketBase();
  const tagsQuery = useAllUserTagsWithoutMetadata();
  const tags = tagsQuery.status === "success" ? tagsQuery.data : [];
  const updateSearchParams = (newParams: Partial<SearchParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    onSearchParamsChange(updatedParams);
  };
  const linkTitleQuery = useQuery({
    queryKey: ["linkTitle", user?.id, searchParams.linkId],
    queryFn: async ({ queryKey }) => {
      const [_1, _2, linkId] = queryKey;
      const link = await pb.collection("links").getOne(linkId, {
        fields: ["id", "title"].join(","),
      });
      return link.title;
    },
    enabled: !!user && !!searchParams.linkId,
    staleTime: 5 * 60 * 1000,
  });

  const clearSearchParams = useCallback(() => {
    updateSearchParams({
      searchText: "",
      tagId: undefined,
      linkId: undefined,
      sort: "newest_first",
    });
  }, [updateSearchParams]);

  const sortOptions = [
    { value: "newest_first", label: "Newest First" },
    { value: "oldest_first", label: "Oldest First" },
  ];

  const selectedFilters: string[] = [];
  if (searchParams.tagId) {
    selectedFilters.push(
      `Tagged with: ${tags.find((t) => t.id === searchParams.tagId)?.name}`,
    );
  }
  if (searchParams.linkId) {
    selectedFilters.push(`From: ${linkTitleQuery.data || searchParams.linkId}`);
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
                  searchParams.sort === "newest_first" ? "default" : "filled"
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
                    searchParams.sort === value ? (
                      <IconCheck className={dropdownClasses.dropdownIcon} />
                    ) : (
                      <span className={dropdownClasses.dropdownIcon} />
                    )
                  }
                  onClick={() =>
                    updateSearchParams({
                      sort: value as "newest_first" | "oldest_first",
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
