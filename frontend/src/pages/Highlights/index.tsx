import { useState } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import useUserHighlightsQuery, {
  Highlight,
  useUserHighlightMutation,
} from "@/hooks/useUserHighlightsQuery";
import LynxShell from "@/pages/LynxShell";
import { Link, useSearchParams } from "react-router-dom";
import {
  Alert,
  Anchor,
  Blockquote,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Indicator,
  Loader,
  SimpleGrid,
  Title,
} from "@mantine/core";
import classes from "./Highlights.module.css";
import URLS from "@/lib/urls";
import LinkTagsDisplay from "@/components/LinkTagsDisplay";
import LynxGrid from "@/components/LynxGrid";
import { IconBlockquote } from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import SearchBar, { SearchParams } from "./SearchBar";

const generateURLWithFragment = (url: string, text: string) => {
  const urlWithoutFragment = url.split("#")[0];
  const words = text.trim().split(/\s+/);
  let processedText;
  if (words.length > 8) {
    const firstFour = encodeURIComponent(words.slice(0, 4).join(" "));
    const lastFour = encodeURIComponent(words.slice(-4).join(" "));
    processedText = `${firstFour},${lastFour}`;
  } else {
    processedText = encodeURIComponent(text);
  }
  const fragment = `#:~:text=${processedText}`;
  return `${urlWithoutFragment}${fragment}`;
};

const getLinkToOriginal = (highlight: Highlight) => {
  if (highlight.linkUrl && highlight.highlighted_text) {
    return generateURLWithFragment(
      highlight.linkUrl,
      highlight.highlighted_text,
    );
  }
  return null;
};

const getLinkInLibrary = (highlight: Highlight) => {
  return highlight.linkId ? URLS.LINK_VIEWER(highlight.linkId) : null;
};

const MetadataRow = ({ highlight }: { highlight: Highlight }) => {
  const originalLink = getLinkToOriginal(highlight);
  const libraryLink = getLinkInLibrary(highlight);
  const items: React.ReactNode[] = [
    libraryLink ? (
      <Center key={`library-${highlight.id}`}>
        <Anchor size="sm" component={Link} to={libraryLink} target="_blank">
          View in library
        </Anchor>
      </Center>
    ) : null,
    originalLink ? (
      <Center key={`original-${highlight.id}`}>
        <Anchor size="sm" component={Link} to={originalLink} target="_blank">
          View original
        </Anchor>
      </Center>
    ) : null,
  ].filter(Boolean);
  const itemsWithDividers = items.reduce(
    (acc: any, item, index) =>
      index === items.length - 1
        ? [...acc, item]
        : [
            ...acc,
            item,
            <Divider key={`divider-${index}`} orientation="vertical" />,
          ],
    [],
  );
  return <div className={classes.metadata}>{itemsWithDividers}</div>;
};

const Highlights: React.FC = () => {
  usePageTitle("My Highlights");
  const { pb, user } = usePocketBase();
  const [urlParams, setUrlParams] = useSearchParams();
  const [searchParams, setSearchParams] = useState<
    Omit<SearchParams, "searchText">
  >({
    sort: "newest_first",
  });
  const searchText = urlParams.get("s") || "";
  const tagId = urlParams.get("t") || undefined;
  const page = parseInt(urlParams.get("p") || "1");
  const linkId = urlParams.get("l") || undefined;
  const setPage = (p: number) => {
    setUrlParams({ ...urlParams, p: p.toString() });
  };

  const queryProps = {
    ...searchParams,
    page,
    searchText,
    tagId,
    linkId,
  };
  const highlightQuery = useUserHighlightsQuery(queryProps);
  const highlightMutator = useUserHighlightMutation(queryProps);

  const handleSearchParamsChange = (newSearchParams: SearchParams) => {
    setSearchParams(newSearchParams);
    const newParams: { [key: string]: string } = {
      s: newSearchParams.searchText,
      p: "1",
    };
    if (newSearchParams.tagId) {
      newParams["t"] = newSearchParams.tagId;
    }
    if (newSearchParams.linkId) {
      newParams["l"] = newSearchParams.linkId;
    }
    setUrlParams(newParams);
  };

  let content = null;
  if (highlightQuery.isPending) {
    content = (
      <Center>
        <Loader />
      </Center>
    );
  } else if (highlightQuery.isError) {
    content = <Alert color="red">{String(highlightQuery.error)}</Alert>;
  } else {
    content = (
      <Container size="xl">
        <Title order={2} mb="md">
          My Highlights
        </Title>
        <SearchBar
          searchParams={{ ...searchParams, searchText, tagId, linkId }}
          onSearchParamsChange={handleSearchParamsChange}
        />
        <LynxGrid>
          {highlightQuery.data.items.map((highlight) => (
            <div key={highlight.id}>
              <Card withBorder shadow="sm">
                <Blockquote
                  cite={`- ${highlight.linkAuthor || highlight.linkTitle}`}
                  icon={<IconBlockquote />}
                  iconSize={35}
                  mb="lg"
                >
                  {highlight.highlighted_text}
                </Blockquote>
                <LinkTagsDisplay
                  link={highlight}
                  size="xs"
                  linkMutator={highlightMutator}
                />
                <Card.Section className={classes.footer}>
                  <MetadataRow highlight={highlight} />
                </Card.Section>
              </Card>
            </div>
          ))}
        </LynxGrid>
      </Container>
    );
  }
  return <LynxShell>{content}</LynxShell>;
};

export default Highlights;
