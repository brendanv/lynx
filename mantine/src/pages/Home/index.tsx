import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import LynxShell from "@/pages/LynxShell";
import SearchBar, { SearchParams } from "@/components/SearchBar";
import useLinksFeedQuery from "@/hooks/useLinksFeedQuery";
import LinkCard, { LinkCardSkeleton } from "@/components/LinkCard";
import { Alert, Center, Pagination, SimpleGrid } from "@mantine/core";
import classes from "./Home.module.css";

export function HomePage() {
  const [urlParams, setUrlParams] = useSearchParams();
  const [searchParams, setSearchParams] = useState<
    Omit<SearchParams, "searchText">
  >({
    readState: "all",
    sortBy: "added_to_library",
  });
  const searchText = urlParams.get("s") || "";
  const tagId = urlParams.get("t") || undefined;
  const page = parseInt(urlParams.get("p") || "1");
  const feedId = urlParams.get("f") || undefined;
  const setPage = (p: number) => {
    setUrlParams({ ...urlParams, p: p.toString() });
  };

  const {
    loading: feedLoading,
    result: queryResult,
    error: feedError,
    refetch,
  } = useLinksFeedQuery({
    page,
    ...searchParams,
    searchText,
    tagId,
    feedId,
  });

  const handleSearchParamsChange = (newSearchParams: SearchParams) => {
    setSearchParams(newSearchParams);
    const newParams: { [key: string]: string } = {
      s: newSearchParams.searchText,
      p: "1",
    };
    if (newSearchParams.tagId) {
      newParams["t"] = newSearchParams.tagId;
    }
    if (newSearchParams.feedId) {
      newParams["f"] = newSearchParams.feedId;
    }
    setUrlParams(newParams);
  };

  let content = null;

  if (feedLoading) {
    content = (
      <div className={classes.linkCards}>
        {Array.from({ length: 5 }, (_, index) => (
          <LinkCardSkeleton key={`skeleton-${index}`} />
        ))}{" "}
      </div>
    );
  } else if (feedLoading && queryResult?.totalItems === 0) {
    content = (
      <Alert title="No Results">
        Try adjusting your filters or add some new links to your feed
      </Alert>
    );
  } else if (feedError && queryResult === null) {
    content = (
      <Alert title="Error" color="red">
        {feedError.message}
      </Alert>
    );
  } else if (!feedLoading && queryResult != null) {
    content = (
      <>
        <div className={classes.linkCards}>
          {queryResult.items.map((item) => {
            return <LinkCard key={item.id} link={item} onUpdate={refetch} />;
          })}
        </div>
        <Center>
          {queryResult.totalPages > 1 && (
            <Pagination
              value={page}
              total={queryResult.totalPages}
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
        searchParams={{ ...searchParams, searchText, tagId, feedId }}
        onSearchParamsChange={handleSearchParamsChange}
      />
      {content}
    </LynxShell>
  );
}
