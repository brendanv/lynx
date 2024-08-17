import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { usePocketBase } from "@/hooks/usePocketBase";

export type SearchParams = {
  searchText?: string;
  readState: "all" | "read" | "unread";
  tagId?: string;
};

type SearchBarProps = {
  onSearchParamsChange: (params: SearchParams) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ onSearchParamsChange }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchText: "",
    readState: "all",
    tagId: undefined,
  });
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
    setSearchParams(updatedParams);
    onSearchParamsChange(updatedParams);
  };

  const handleSearch = () => {
    onSearchParamsChange(searchParams);
  };

  const clearFilters = () => {
    const clearedParams: SearchParams = {
      searchText: "",
      readState: "all",
      tagId: undefined,
    };
    setSearchParams(clearedParams);
    onSearchParamsChange(clearedParams);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Search..."
          value={searchParams.searchText}
          onChange={(e) => updateSearchParams({ searchText: e.target.value })}
          className="flex-grow"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <div className="flex space-x-2">
        <Select
          value={searchParams.readState}
          onValueChange={(value) =>
            updateSearchParams({
              readState: value as "all" | "read" | "unread",
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Read state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.tagId}
          onValueChange={(value) =>
            updateSearchParams({ tagId: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex space-x-2">
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
        {(searchParams.readState !== "all" || searchParams.tagId) && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
