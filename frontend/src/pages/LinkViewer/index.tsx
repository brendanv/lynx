import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDisclosure, useWindowScroll } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import {
  ActionIcon,
  Affix,
  Anchor,
  BackgroundImage,
  Container,
  Text,
  Transition,
  TypographyStylesProvider,
  Group,
  Stack,
  Skeleton,
  Alert,
  Box,
  useComputedColorScheme,
  Button,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowUp,
  IconClockFilled,
  IconFileTextAi,
  IconLink,
  IconUserFilled,
  IconCalendarFilled,
} from "@tabler/icons-react";
import { FullBleedLynxShell } from "@/pages/LynxShell";
import useLinkViewerQuery, {
  LinkView,
  useLinkViewerMutation,
} from "@/hooks/useLinkViewerQuery";
import { usePageTitle } from "@/hooks/usePageTitle";
import { nprogress, NavigationProgress } from "@mantine/nprogress";
import { usePocketBase } from "@/hooks/usePocketBase";
import classes from "./LinkViewer.module.css";
import LinkTagsDisplay from "@/components/LinkTagsDisplay";
import { Rangee } from "rangee";
import useCreateHighlightMutation from "@/hooks/useCreateHighlightMutation";
import DrawerDialog from "@/components/DrawerDialog";
const rangee = new Rangee({ document });

const LinkViewer = () => {
  const { id } = useParams();

  if (id === undefined) {
    return <FullBleedLynxShell>error</FullBleedLynxShell>;
  }

  const linkQuery = useLinkViewerQuery(id, true);
  usePageTitle(linkQuery.data?.title || "View Link");

  if (linkQuery.isPending) {
    return (
      <FullBleedLynxShell>
        <LoadingView />
      </FullBleedLynxShell>
    );
  }

  if (linkQuery.isError) {
    return (
      <FullBleedLynxShell>
        <ErrorView error={linkQuery.error} />
      </FullBleedLynxShell>
    );
  }

  return <ArticleView linkView={linkQuery.data} />;
};

const ArticleHeader: React.FC<{
  linkView: LinkView;
}> = ({ linkView }) => {
  const [isSummaryOpen, { open: openSummary, close: closeSummary }] =
    useDisclosure(false);
  const colorScheme = useComputedColorScheme();
  const linkMutation = useLinkViewerMutation();
  const formattedDate = linkView.article_date?.toLocaleDateString("en-US", {
    year: "numeric" as const,
    month: "short" as const,
    day: "numeric" as const,
  });
  const innerContent = (
    <Container className={classes.fullWH} size="md">
      <Stack
        className={classes.fullWH}
        pb="sm"
        align="flex-start"
        justify="flex-end"
      >
        <Text fw={700} size="xl">
          {linkView.title}
        </Text>
        <Group gap="md" className={classes.metadata}>
          {linkView.author ? (
            <div className={classes.metadataWithIcon}>
              <IconUserFilled size={16} />
              {linkView.author}
            </div>
          ) : null}
          {formattedDate ? (
            <div className={classes.metadataWithIcon}>
              <IconCalendarFilled size={16} />
              {formattedDate}
            </div>
          ) : null}
          {linkView.read_time_display ? (
            <div className={classes.metadataWithIcon}>
              <IconClockFilled size={16} />
              {linkView.read_time_display}
            </div>
          ) : null}
          {linkView.cleaned_url ? (
            <div className={classes.metadataWithIcon}>
              <IconLink size={16} />
              <Anchor underline="hover" href={linkView.cleaned_url || ""}>
                {linkView.hostname}
              </Anchor>
            </div>
          ) : null}
          {linkView.summary ? (
            <div className={classes.metadataWithIcon}>
              <IconFileTextAi size={16} />
              <Anchor underline="hover" onClick={openSummary}>
                View Summary
              </Anchor>
            </div>
          ) : null}
          <LinkTagsDisplay
            size="xs"
            link={linkView}
            linkMutator={linkMutation}
          />
          <DrawerDialog
            title={`Summary for ${linkView.title}`}
            open={isSummaryOpen}
            onClose={closeSummary}
          >
            <pre className={classes.summaryPre}>{linkView.summary}</pre>
          </DrawerDialog>
        </Group>
      </Stack>
    </Container>
  );
  const secondImgClassName =
    colorScheme === "light"
      ? classes.headerImgLightOverlay
      : classes.headerImgDarkOverlay;
  return (
    <Box className={classes.headerContainer}>
      {linkView.header_image_url ? (
        <BackgroundImage
          className={`${classes.headerImg} ${secondImgClassName}`}
          src={linkView.header_image_url}
        >
          {innerContent}
        </BackgroundImage>
      ) : (
        <div className={classes.fullWH}>{innerContent}</div>
      )}
    </Box>
  );
};

const ArticleView = ({ linkView }: { linkView: LinkView }) => {
  const [progress, setProgress] = useState(linkView.reading_progress || 0);
  const [lastSentProgress, setLastSentProgress] = useState(
    linkView.reading_progress || 0,
  );
  const linkMutation = useLinkViewerMutation();
  const [scroll, scrollTo] = useWindowScroll();
  const [selection, setSelection] = useState<Range | null>(null);
  const createHighlightMutation = useCreateHighlightMutation();

  const { pb } = usePocketBase();
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const newProgress = scrollTop / scrollHeight;
    setProgress(newProgress);
    nprogress.set(newProgress * 100.0);
  }, [setProgress]);

  // Hacky use of refs to be able to access the current state without
  // creating a new updateReadingProgress callback. If we use the
  // state values directly we need to include them in the deps array,
  // which ultimately causes us to reset our interval every time the
  // state changes...
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  const lastSentRef = useRef(lastSentProgress);
  useEffect(() => {
    lastSentRef.current = lastSentProgress;
  }, [lastSentProgress]);

  const updateReadingProgress = useCallback(async () => {
    if (Math.abs(progressRef.current - lastSentRef.current) > 0.01) {
      linkMutation.mutate({
        id: linkView.id,
        updates: {
          reading_progress: progressRef.current,
        },
        options: {
          afterSuccess: () => {
            setLastSentProgress(progressRef.current);
          },
        },
      });
    }
  }, [pb, linkView.id]);

  useEffect(() => {
    if (linkView.reading_progress) {
      const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrollPosition = scrollHeight * linkView.reading_progress;
      window.scrollTo(0, scrollPosition);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [linkView.reading_progress, handleScroll]);

  useEffect(() => {
    const interval = setInterval(updateReadingProgress, 10000);
    return () => {
      clearInterval(interval);
      updateReadingProgress();
    };
  }, [updateReadingProgress]);

  const handleSelection = () => {
    const selObj = window.getSelection();
    if (selObj && !selObj.isCollapsed) {
      setSelection(selObj.getRangeAt(0));
    } else {
      setSelection(null);
    }
  };

  const saveHighlight = () => {
    if (selection) {
      const serialized = rangee.serializeAtomic(selection);
      createHighlightMutation.mutate({
        link: linkView,
        serializedRange: serialized,
        highlightedText: selection.toString(),
      });
    }
  };

  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.highlights) {
      CSS.highlights.clear();
      CSS.highlights.set(
        "article-highlights",
        new Highlight(
          ...linkView.highlights
            .map((h) => rangee.deserializeAtomic(h.serialized_range))
            .flat(),
        ),
      );
    }
  }, [linkView.highlights]);

  return (
    <FullBleedLynxShell>
      <NavigationProgress />
      <ArticleHeader linkView={linkView} />
      <Container size="md">
        <TypographyStylesProvider fz="lg" px="0.5rem">
          <div
            className={classes.articleContent}
            dangerouslySetInnerHTML={{ __html: linkView.article_html || "" }}
            onMouseUp={handleSelection}
            onTouchEnd={handleSelection}
          />
        </TypographyStylesProvider>
      </Container>
      {selection && (
        <Affix position={{ bottom: 20, right: 20 }}>
          <Button onClick={saveHighlight}>Save Highlight</Button>
        </Affix>
      )}
      <Affix position={{ bottom: 20, right: selection ? 180 : 20 }}>
        <Transition transition="slide-up" mounted={scroll.y > 0}>
          {(transitionStyles) => (
            <ActionIcon
              radius="xl"
              size="lg"
              onClick={() => scrollTo({ y: 0 })}
              style={transitionStyles}
              aria-label="Scroll to top"
            >
              <IconArrowUp style={{ width: "70% ", height: "70%" }} />
            </ActionIcon>
          )}
        </Transition>
      </Affix>
    </FullBleedLynxShell>
  );
};

const LoadingView: React.FC = () => (
  <Container size="md">
    <Skeleton height={200} mb="md" />
    <Skeleton height={50} mb="sm" />
    <Skeleton height={20} mb="sm" />
    <Skeleton height={20} mb="sm" />
    <Skeleton height={20} mb="xl" />
    <Skeleton height={400} />
  </Container>
);

const ErrorView: React.FC<{ error: Error }> = ({ error }) => (
  <Container size="md">
    <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
      {error.message}
    </Alert>
  </Container>
);

export default LinkViewer;
