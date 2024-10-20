import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import {
  Card,
  Text,
  Button,
  Loader,
  Alert,
  Pagination,
  Title,
  Container,
} from "@mantine/core";
import { usePageTitle } from "@/hooks/usePageTitle";
import URLS from "@/lib/urls";
import parseNewLink from "@/utils/parseNewLink";
import LynxShell from "@/pages/LynxShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Feed from "@/types/Feed";
import { notifications } from "@mantine/notifications";
import { useInvalidateLinksFeed } from "@/hooks/useLinksFeedQuery";
import LynxGrid from "@/components/LynxGrid";

type FeedItem = {
  id: string;
  title: string;
  pub_date: string;
  description: string;
  url: string;
  saved_as_link: string | null;
};

const ITEMS_PER_PAGE = 12;

const FeedItems: React.FC = () => {
  const { id: feedId } = useParams<{ id: string }>();
  const { pb, user } = usePocketBase();
  const [page, setPage] = useState(1);
  const [savingItems, setSavingItems] = useState<{ [key: string]: boolean }>(
    {},
  );
  const queryClient = useQueryClient();
  const invalidateLinksFeed = useInvalidateLinksFeed();

  const feedItemQuery = useQuery({
    queryKey: ["feedItems", user?.id, { feedId, page }],
    queryFn: async ({
      queryKey,
    }: {
      queryKey: ["feedItems", string | null, { feedId?: string; page: number }];
    }) => {
      const [_1, _2, { feedId, page }] = queryKey;
      if (!feedId) {
        return {
          page,
          perPage: ITEMS_PER_PAGE,
          totalItems: 0,
          totalPages: 1,
          items: [],
        };
      }
      return await pb
        .collection("feed_items")
        .getList<FeedItem>(page, ITEMS_PER_PAGE, {
          filter: pb.filter("feed={:feedId}", { feedId }),
          sort: "-pub_date",
        });
    },
    staleTime: 60 * 1000,
    enabled: !!user && !!feedId,
  });

  const feedQuery = useQuery({
    queryKey: ["feed", user?.id, feedId],
    queryFn: async ({
      queryKey,
    }: {
      queryKey: ["feed", string | null, string | undefined];
    }) => {
      const [_1, _2, feedIdForQuery] = queryKey;
      if (!feedIdForQuery) {
        return null as Feed | null;
      }
      return await pb.collection<Feed>("feeds").getOne(feedIdForQuery);
    },
    staleTime: 60 * 1000,
    enabled: !!user && !!feedId,
  });

  usePageTitle(feedQuery.data?.name || "");

  const saveToLibraryMutation = useMutation({
    mutationFn: async ({ item }: { item: FeedItem }) => {
      setSavingItems((prev) => ({ ...prev, [item.id]: true }));
      return await parseNewLink(item.url, pb, item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["feedItems", user?.id, { feedId, page }],
      });
      invalidateLinksFeed();
    },
    onError: (error) => {
      console.log(error);
      notifications.show({
        message: "Failed to save feed item.",
        color: "red",
      });
    },
    onSettled: (_data, _error, variables, _context) => {
      setSavingItems((prev) => ({ ...prev, [variables.item.id]: false }));
    },
  });

  if (feedItemQuery.isError) {
    return (
      <LynxShell>
        <Container size="xl">
          <Title order={2} mb="md">
            Feed: {feedQuery.data?.name}
          </Title>
          {feedItemQuery.isError && (
            <Alert color="red" mb="md" title="Error">
              {String(feedItemQuery.error)}
            </Alert>
          )}
        </Container>
      </LynxShell>
    );
  } else if (feedItemQuery.isPending) {
    return (
      <LynxShell>
        <Container size="xl">
          <Title order={2} mb="md">
            Feed: {feedQuery.data?.name}
          </Title>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "64px",
            }}
          >
            <Loader size="xl" />
          </div>
        </Container>
      </LynxShell>
    );
  }

  return (
    <LynxShell>
      <Container size="xl">
        <Title order={2} mb="md">
          Feed: {feedQuery.data?.name}
        </Title>
        <LynxGrid>
          {feedItemQuery.data.items.map((item) => (
            <div key={item.id}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Text fw={500} size="lg" lineClamp={2} p="md">
                    {item.title}
                  </Text>
                </Card.Section>
                <Text size="sm" c="dimmed" mb="xs">
                  {new Date(item.pub_date).toLocaleString()}
                </Text>
                <Text lineClamp={3} mb="md">
                  {item.description}
                </Text>
                {item.saved_as_link ? (
                  <Button
                    component={Link}
                    to={URLS.LINK_VIEWER(item.saved_as_link)}
                    variant="light"
                    fullWidth
                  >
                    View In Library
                  </Button>
                ) : (
                  <Button
                    onClick={() => saveToLibraryMutation.mutate({ item })}
                    disabled={savingItems[item.id]}
                    loading={savingItems[item.id]}
                    fullWidth
                  >
                    {savingItems[item.id] ? "Saving..." : "Save to Library"}
                  </Button>
                )}
              </Card>
            </div>
          ))}
        </LynxGrid>
        {feedItemQuery.data.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <Pagination
              total={feedItemQuery.data.totalPages}
              value={feedItemQuery.data.page}
              onChange={setPage}
            />
          </div>
        )}
      </Container>
    </LynxShell>
  );
};

export default FeedItems;
