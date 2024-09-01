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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PlusCircle } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import SettingsBase from "@/components/pages/settings/SettingsBase";
import FeedCard from "@/components/FeedCard";
import DrawerDialog from "@/components/DrawerDialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";

type Feed = {
  id: string;
  name: string;
  feed_url: string;
  description: string;
  image_url: string;
  auto_add_feed_items_to_library: boolean;
  last_fetched_at: string;
};

const addFeedFormSchema = z.object({
  feedUrl: z.string().min(3, {
    message: "URL is required",
  }),
  autoAdd: z.boolean(),
});

const Feeds: React.FC = () => {
  const { pb } = usePocketBase();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    feedId: string | null;
  }>({ isOpen: false, feedId: null });
  usePageTitle("Feeds");
  const form = useForm<z.infer<typeof addFeedFormSchema>>({
    resolver: zodResolver(addFeedFormSchema),
    defaultValues: {
      feedUrl: "",
      autoAdd: false,
    },
  });

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const records = await pb.collection("feeds").getFullList<Feed>({
        sort: "-created",
      });
      setFeeds(records);
      setError(null);
    } catch (err) {
      console.error("Error fetching feeds:", err);
      setError("Failed to fetch feeds. Please try again.");
    }
  };

  const handleAddFeed = async (values: z.infer<typeof addFeedFormSchema>) => {
    try {
      const formData = new FormData();
      formData.append("url", values.feedUrl);
      formData.append("auto_add_items", values.autoAdd.toString());
      await pb.send("/lynx/parse_feed", { method: "POST", body: formData });
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
            <DrawerDialog
              open={isAddDialogOpen}
              handleOpenChange={setIsAddDialogOpen}
              footer={
                <Button
                  type="submit"
                  onClick={form.handleSubmit(handleAddFeed)}
                >
                  Add Feed
                </Button>
              }
              title="Add New RSS Feed"
              trigger={
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Feed
                </Button>
              }
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddFeed)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="feedUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feed URL</FormLabel>
                        <FormControl>
                          <Input placeholder="example.com/feed" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="autoAdd"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg">
                        <FormLabel>
                          Automatically add new feed items to library?
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </DrawerDialog>
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
