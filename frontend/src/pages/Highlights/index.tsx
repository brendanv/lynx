import { usePocketBase } from "@/hooks/usePocketBase";
import useUserHighlightsQuery, {
  Highlight,
  useUserHighlightMutation,
} from "@/hooks/useUserHighlightsQuery";
import { useState } from "react";
import LynxShell from "@/pages/LynxShell";
import { Link } from "react-router-dom";
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
import {IconBlockquote} from '@tabler/icons-react'
import { usePageTitle } from "@/hooks/usePageTitle";

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
      <Center>
        <Anchor
          size="sm"
          component={Link}
          to={libraryLink}
          target="_blank"
          key={`library-${highlight.id}`}
        >
          View in library
        </Anchor>
      </Center>
    ) : null,
    originalLink ? (
      <Center>
        <Anchor
          size="sm"
          component={Link}
          to={originalLink}
          target="_blank"
          key={`original-${highlight.id}`}
        >
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
  const { pb, user } = usePocketBase();
  const [page, setPage] = useState(1);
  usePageTitle('My Highlights')
  const highlightQuery = useUserHighlightsQuery({ page });
  const highlightMutator = useUserHighlightMutation({ page });

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
        <LynxGrid>
          {highlightQuery.data.items.map((highlight) => (
            <div key={highlight.id}>
              <Card withBorder shadow="sm">
                <Blockquote
                  cite={`- ${highlight.linkAuthor || highlight.linkTitle}`}
                  icon={<IconBlockquote  />}
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
