import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import {
  Card,
  Text,
  Button,
  SimpleGrid,
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
  const { pb } = usePocketBase();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedName, setFeedName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingItems, setSavingItems] = useState<{ [key: string]: boolean }>(
    {},
  );

  usePageTitle(feedName);

  useEffect(() => {
    fetchFeedItems();
  }, [feedId, page]);

  useEffect(() => {
    fetchFeedName();
  }, [feedId]);

  const fetchFeedItems = async () => {
    setLoading(true);
    try {
      const records = await pb
        .collection("feed_items")
        .getList<FeedItem>(page, ITEMS_PER_PAGE, {
          filter: `feed="${feedId}"`,
          sort: "-pub_date",
        });
      setFeedItems(records.items);
      setTotalPages(Math.ceil(records.totalItems / ITEMS_PER_PAGE));
      setError(null);
    } catch (err) {
      console.error("Error fetching feed items:", err);
      setError("Failed to fetch feed items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedName = async () => {
    if (feedId === undefined) {
      return;
    }
    try {
      const feed = await pb.collection("feeds").getOne(feedId);
      setFeedName(feed.name);
    } catch (err) {
      console.error("Error fetching feed name:", err);
    }
  };

  const handleSaveToLibrary = async (item: FeedItem) => {
    setSavingItems((prev) => ({ ...prev, [item.id]: true }));
    try {
      await parseNewLink(item.url, pb, item.id);
      fetchFeedItems();
    } catch (e: any) {
      console.log(e);
      setError(e.message);
    } finally {
      setSavingItems((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <LynxShell>
      <Container size="xl">
        <Title order={2} mb="md">
          Feed: {feedName}
        </Title>
        {error && (
          <Alert color="red" mb="md" title="Error">
            {error}
          </Alert>
        )}
        {loading ? (
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
        ) : (
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing={{ base: 10, sm: "xl" }}
            verticalSpacing={{ base: "md", sm: "xl" }}
          >
            {feedItems.map((item) => (
              <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
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
                    onClick={() => handleSaveToLibrary(item)}
                    disabled={savingItems[item.id]}
                    loading={savingItems[item.id]}
                    fullWidth
                  >
                    {savingItems[item.id] ? "Saving..." : "Save to Library"}
                  </Button>
                )}
              </Card>
            ))}
          </SimpleGrid>
        )}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <Pagination total={totalPages} value={page} onChange={setPage} />
          </div>
        )}
      </Container>
    </LynxShell>
  );
};

export default FeedItems;
