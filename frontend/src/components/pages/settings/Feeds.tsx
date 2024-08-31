import React, { useState, useEffect } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import PageWithHeader from "@/components/pages/PageWithHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import SettingsBase from "@/components/pages/settings/SettingsBase";
import FeedCard from "@/components/FeedCard";
import { Checkbox } from "@/components/ui/checkbox";

type Feed = {
  id: string;
  name: string;
  feed_url: string;
  description: string;
  image_url: string;
  auto_add_feed_items_to_library: boolean;
  last_fetched_at: string;
};

const Feeds: React.FC = () => {
  const { pb } = usePocketBase();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [newFeed, setNewFeed] = useState({ feed_url: "", auto_add_items: false });
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    feedId: string | null;
  }>({ isOpen: false, feedId: null });
  usePageTitle("Feeds");

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const records = await pb.collection("feeds").getFullList<Feed>({
        sort: "-created",
      });
      setFeeds(records);
    } catch (err) {
      console.error("Error fetching feeds:", err);
      setError("Failed to fetch feeds. Please try again.");
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("url", newFeed.feed_url);
      formData.append("auto_add_items", newFeed.auto_add_items.toString());
      await pb.send("/lynx/parse_feed", { method: "POST", body: formData });
      setNewFeed({ feed_url: "", auto_add_items: false });
      fetchFeeds();
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding feed:", err);
      setError("Failed to add feed. Please try again.");
    }
  };

  const openDeleteConfirmation = (id: string) => {
    setDeleteConfirmation({ isOpen: true, feedId: id });
  };

  const handleDeleteFeed = async () => {
    if (deleteConfirmation.feedId) {
      try {
        await pb.collection("feeds").delete(deleteConfirmation.feedId);
        fetchFeeds();
        setDeleteConfirmation({ isOpen: false, feedId: null });
      } catch (err) {
        console.error("Error deleting feed:", err);
        setError("Failed to delete feed. Please try again.");
      }
    }
  };

  const handleToggleAutoAdd = async (id: string, currentValue: boolean) => {
    try {
      await pb.collection("feeds").update(id, {
        auto_add_feed_items_to_library: !currentValue,
      });
      fetchFeeds();
    } catch (err) {
      console.error("Error updating feed:", err);
      setError("Failed to update feed. Please try again.");
    }
  };

  return (
    <PageWithHeader>
      <SettingsBase>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">RSS Feeds</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Feed
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New RSS Feed</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddFeed}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="url" className="text-right">
                        Feed URL
                      </label>
                      <Input
                        id="url"
                        value={newFeed.feed_url}
                        onChange={(e) =>
                          setNewFeed({ ...newFeed, feed_url: e.target.value })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto_add_items"
                        checked={newFeed.auto_add_items}
                        onCheckedChange={(checked) =>
                          setNewFeed({ ...newFeed, auto_add_items: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="auto_add_items"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Automatically add new items to library
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Feed</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {feeds.map((feed) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                onToggleAutoAdd={handleToggleAutoAdd}
                onDelete={openDeleteConfirmation}
              />
            ))}
          </CardContent>
        </Card>
      </SettingsBase>
      <Dialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation({ ...deleteConfirmation, isOpen })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this feed? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteConfirmation({ isOpen: false, feedId: null })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFeed}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWithHeader>
  );
};

export default Feeds;