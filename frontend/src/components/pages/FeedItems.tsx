import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import PageWithHeader from "@/components/pages/PageWithHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import URLS from "@/lib/urls";
import parseNewLink from "@/utils/parseNewLink";
import Paginator from "@/components/Paginator";
import { Loader2 } from "lucide-react";

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
  usePageTitle("Feed Items");

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
    <PageWithHeader>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Feed Items: {feedName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {feedItems.map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(item.pub_date).toLocaleString()}
                    </p>
                    <p className="line-clamp-3">{item.description}</p>
                  </CardContent>
                  <CardFooter>
                    {item.saved_as_link ? (
                      <Link
                        to={URLS.LINK_VIEWER(item.saved_as_link)}
                        className="w-full"
                      >
                        <Button variant="outline" className="w-full">
                          View In Library
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => handleSaveToLibrary(item)}
                        disabled={savingItems[item.id]}
                        className="w-full"
                      >
                        {savingItems[item.id] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Saving...
                          </>
                        ) : (
                          "Save to Library"
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          <div className="flex justify-center mt-8">
            <Paginator
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>
    </PageWithHeader>
  );
};

export default FeedItems;
