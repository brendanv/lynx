import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import LynxShell from "@/pages/LynxShell";
import SearchBar, { SearchParams } from "@/components/SearchBar";
import useLinksFeedQuery, {
  useLinksFeedMutation,
} from "@/hooks/useLinksFeedQuery";
import LinkCard, { LinkCardSkeleton } from "@/components/LinkCard";
import { Alert, Center, Loader, Pagination } from "@mantine/core";
import BulkActions from "@/components/BulkActions";
import { usePageTitle } from "@/hooks/usePageTitle";
import LynxGrid from "@/components/LynxGrid";
import {
  getReadState,
  getHighlightState,
  getStarredState,
  getSortBy,
} from "@/utils/searchUtils";
import classes from "./home.module.css";
import cx from "clsx";

export function HomePage() {
  usePageTitle("My Feed");
  const [urlParams, setUrlParams] = useSearchParams();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchText: urlParams.get("s") || "",
    tagId: urlParams.get("t") || undefined,
    feedId: urlParams.get("f") || undefined,
    readState: getReadState(urlParams.get("r")),
    sortBy: getSortBy(urlParams.get("sort")),
    starredState: getStarredState(urlParams.get("st")),
    highlightState: getHighlightState(urlParams.get("h")),
  });
  const page = parseInt(urlParams.get("p") || "1");
  const setPage = (p: number) => {
    setUrlParams((prev) => {
      prev.set("p", p.toString());
      return prev;
    });
  };
  const queryProps = { ...searchParams, page };

  const linksQuery = useLinksFeedQuery(queryProps);
  const linksMutation = useLinksFeedMutation(queryProps);

  const handleSearchParamsChange = (newSearchParams: SearchParams) => {
    setSearchParams(newSearchParams);
    const newUrlParams = new URLSearchParams();
    if (newSearchParams.searchText)
      newUrlParams.set("s", newSearchParams.searchText);
    if (newSearchParams.tagId) newUrlParams.set("t", newSearchParams.tagId);
    if (newSearchParams.feedId) newUrlParams.set("f", newSearchParams.feedId);
    if (newSearchParams.readState !== "all")
      newUrlParams.set("r", newSearchParams.readState);
    if (newSearchParams.sortBy !== "added_to_library")
      newUrlParams.set("sort", newSearchParams.sortBy);
    if (newSearchParams.highlightState !== "all")
      newUrlParams.set("h", newSearchParams.highlightState);
    if (newSearchParams.starredState !== "all")
      newUrlParams.set("st", newSearchParams.starredState);

    // Preserve page number if it exists
    const currentPage = urlParams.get("p");
    if (currentPage) newUrlParams.set("p", currentPage);

    setUrlParams(newUrlParams);
  };
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems(new Set());
  };
  const selectItemAndEnableSelections = (id: string) => {
    setSelectionMode(true);
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  let content = null;

  if (linksQuery.isPending) {
    content = (
      <LynxGrid fullBleedAtSingleColumn>
        {Array.from({ length: 5 }, (_, index) => (
          <LinkCardSkeleton key={`skeleton-${index}`} />
        ))}{" "}
      </LynxGrid>
    );
  } else if (linksQuery.isError) {
    content = (
      <Alert title="Error" color="red">
        {linksQuery.error.message}
      </Alert>
    );
  } else if (linksQuery.data.totalItems === 0) {
    content = (
      <Alert title="No Results">
        Try adjusting your filters or add some new links to your feed
      </Alert>
    );
  } else {
    content = (
      <>
        {linksQuery.isPlaceholderData && (
          <Center mb="md">
            <Loader />
          </Center>
        )}
        <LynxGrid fullBleedAtSingleColumn>
          {linksQuery.data.items.map((item) => (
            <LinkCard
              key={item.id}
              link={item}
              linkMutator={linksMutation}
              selectionModeEnabled={selectionMode}
              isSelected={selectedItems.has(item.id)}
              onToggleSelect={selectItemAndEnableSelections}
            />
          ))}
        </LynxGrid>
        <Center>
          {linksQuery.data.totalPages > 1 && (
            <Pagination
              value={linksQuery.data.page}
              total={linksQuery.data.totalPages}
              onChange={setPage}
            />
          )}
        </Center>
      </>
    );
  }

  return (
    <LynxShell>
      <SearchBar
        searchParams={queryProps}
        onSearchParamsChange={handleSearchParamsChange}
      />
      {selectionMode && (
        <div className={classes.selectionControls}>
          <BulkActions
            selectionMode={selectionMode}
            selectedItems={selectedItems}
            toggleSelectionMode={toggleSelectionMode}
            clearSelection={clearSelection}
          />
        </div>
      )}
      <div className={cx({ [classes.contentWrapper]: !selectionMode })}>
        {content}
      </div>
    </LynxShell>
  );
}
