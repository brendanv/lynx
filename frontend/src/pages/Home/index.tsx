import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import LynxShell from "@/pages/LynxShell";
import SearchBar, { SearchParams } from "@/components/SearchBar";
import useLinksFeedQuery, {
  useLinksFeedMutation,
} from "@/hooks/useLinksFeedQuery";
import LinkCard, { LinkCardSkeleton } from "@/components/LinkCard";
import { Alert, Center, Loader, Pagination } from "@mantine/core";
import classes from "./Home.module.css";
import { usePageTitle } from "@/hooks/usePageTitle";

export function HomePage() {
  usePageTitle("My Feed");
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

  const queryProps = {
    page,
    ...searchParams,
    searchText,
    tagId,
    feedId,
  };
  const linksQuery = useLinksFeedQuery(queryProps);
  const linksMutation = useLinksFeedMutation(queryProps);

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

  if (linksQuery.isPending) {
    content = (
      <div className={classes.linkCards}>
        {Array.from({ length: 5 }, (_, index) => (
          <LinkCardSkeleton key={`skeleton-${index}`} />
        ))}{" "}
      </div>
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
        <div className={classes.linkCards}>
          {linksQuery.data.items.map((item) => {
            return (
              <LinkCard key={item.id} link={item} linkMutator={linksMutation} />
            );
          })}
        </div>
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
        searchParams={{ ...searchParams, searchText, tagId, feedId }}
        onSearchParamsChange={handleSearchParamsChange}
      />
      {content}
    </LynxShell>
  );
}
