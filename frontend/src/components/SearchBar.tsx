import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, X, Filter, SortAsc } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePocketBase } from "@/hooks/usePocketBase";

export type SearchParams = {
  searchText: string;
  readState: "all" | "read" | "unread";
  tagId?: string;
  sortBy: "added_to_library" | "article_date";
};

type SearchBarProps = {
  searchParams: SearchParams;
  onSearchParamsChange: (params: SearchParams) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({
  searchParams,
  onSearchParamsChange,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const { pb } = usePocketBase();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const records = await pb
          .collection("tags")
          .getFullList<{ id: string; name: string }>({
            sort: "name",
          });
        setTags(records);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, [pb]);

  const updateSearchParams = (newParams: Partial<SearchParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    onSearchParamsChange(updatedParams);
  };

  const clearFilters = () => {
    const clearedParams: SearchParams = {
      searchText: searchParams.searchText,
      readState: "all",
      tagId: undefined,
      sortBy: "added_to_library",
    };
    onSearchParamsChange(clearedParams);
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

  const activeFiltersCount =
    (searchParams.readState !== "all" ? 1 : 0) + (searchParams.tagId ? 1 : 0);
  console.log(searchParams, activeFiltersCount);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Search..."
          value={searchParams.searchText}
          onChange={(e) => updateSearchParams({ searchText: e.target.value })}
          className="flex-grow"
        />
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <div className="p-2">
              <div className="font-semibold mb-2">Read State</div>
              {readStates.map((state) => (
                <Button
                  key={state.value}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    updateSearchParams({
                      readState: state.value as "all" | "read" | "unread",
                    })
                  }
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      searchParams.readState === state.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {state.label}
                </Button>
              ))}
              <div className="font-semibold mb-2 mt-4">Tags</div>
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    updateSearchParams({
                      tagId: searchParams.tagId === tag.id ? undefined : tag.id,
                    })
                  }
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      searchParams.tagId === tag.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {tag.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <SortAsc className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Sort</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <div className="p-2">
              <div className="font-semibold mb-2">Sort By</div>
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    updateSearchParams({
                      sortBy: option.value as
                        | "added_to_library"
                        | "article_date",
                    });
                    setSortOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      searchParams.sortBy === option.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {searchParams.readState !== "all" && (
          <Badge variant="secondary">
            {searchParams.readState}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => updateSearchParams({ readState: "all" })}
            />
          </Badge>
        )}
        {searchParams.tagId && (
          <Badge variant="secondary">
            {tags.find((tag) => tag.id === searchParams.tagId)?.name}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => updateSearchParams({ tagId: undefined })}
            />
          </Badge>
        )}
        {searchParams.sortBy !== "added_to_library" && (
          <Badge variant="secondary">
            Sorted by:{" "}
            {searchParams.sortBy === "article_date"
              ? "Article Date"
              : "Date Added"}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => updateSearchParams({ sortBy: "added_to_library" })}
            />
          </Badge>
        )}
        {(activeFiltersCount > 0 ||
          searchParams.sortBy !== "added_to_library") && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters & Sort
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
