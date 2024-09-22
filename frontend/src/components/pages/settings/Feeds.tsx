import React, { useState } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import PageWithHeader from "@/components/pages/PageWithHeader";
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
import { PlusCircle, ToggleLeft, ToggleRight, Eye, Trash2 } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import SettingsBase from "@/components/pages/settings/SettingsBase";
import DrawerDialog from "@/components/DrawerDialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "react-router-dom";
import URLS from "@/lib/urls";
import useAllUserFeeds from "@/hooks/useAllUserFeeds";

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

const FeedCard: React.FC<{
  feed: Feed;
  onToggleAutoAdd: (id: string, currentValue: boolean) => void;
  onDelete: (id: string) => void;
}> = ({ feed, onToggleAutoAdd, onDelete }) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-start mb-2">
          <img
            src={feed.image_url || "/img/lynx_placeholder.png"}
            alt={feed.name}
            className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mr-4 rounded-lg flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold truncate">{feed.name}</h3>
            <div className="max-h-16 overflow-y-auto mb-2">
              <p className="text-sm text-gray-600 break-all">{feed.feed_url}</p>
            </div>
            <p className="text-sm mb-2 break-words">{feed.description}</p>
            <p className="text-xs text-gray-500">
              Last fetched: {new Date(feed.last_fetched_at).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() =>
              onToggleAutoAdd(feed.id, feed.auto_add_feed_items_to_library)
            }
          >
            {feed.auto_add_feed_items_to_library ? (
              <>
                <ToggleRight className="mr-2 h-4 w-4" />
                Auto-add On
              </>
            ) : (
              <>
                <ToggleLeft className="mr-2 h-4 w-4" />
                Auto-add Off
              </>
            )}
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link to={URLS.FEED_ITEMS(feed.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Items
            </Link>
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => onDelete(feed.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const Feeds: React.FC = () => {
  const { pb } = usePocketBase();
  const { feeds, error, refetch } = useAllUserFeeds();
  const [actionError, setActionError] = useState<string | null>(null);
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

  const handleAddFeed = async (values: z.infer<typeof addFeedFormSchema>) => {
    try {
      setActionError(null);
      const formData = new FormData();
      formData.append("url", values.feedUrl);
      formData.append("auto_add_items", values.autoAdd.toString());
      await pb.send("/lynx/parse_feed", { method: "POST", body: formData });
      await refetch();
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding feed:", err);
      setActionError("Failed to add feed. Please try again.");
    }
  };

  const openDeleteConfirmation = (id: string) => {
    setDeleteConfirmation({ isOpen: true, feedId: id });
  };

  const handleDeleteFeed = async () => {
    if (deleteConfirmation.feedId) {
      try {
        setActionError(null);
        await pb.collection("feeds").delete(deleteConfirmation.feedId);
        await refetch();
        setDeleteConfirmation({ isOpen: false, feedId: null });
      } catch (err) {
        console.error("Error deleting feed:", err);
        setActionError("Failed to delete feed. Please try again.");
      }
    }
  };

  const handleToggleAutoAdd = async (id: string, currentValue: boolean) => {
    try {
      setActionError(null);
      await pb.collection("feeds").update(id, {
        auto_add_feed_items_to_library: !currentValue,
      });
      await refetch();
    } catch (err) {
      console.error("Error updating feed:", err);
      setActionError("Failed to update feed. Please try again.");
    }
  };

  return (
    <PageWithHeader>
      <SettingsBase>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">RSS Feeds</h2>
          <DrawerDialog
            open={isAddDialogOpen}
            handleOpenChange={setIsAddDialogOpen}
            footer={
              <Button type="submit" onClick={form.handleSubmit(handleAddFeed)}>
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
        </div>
        {(error || actionError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || actionError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          {feeds.map((feed) => (
            <FeedCard
              key={feed.id}
              feed={feed}
              onToggleAutoAdd={handleToggleAutoAdd}
              onDelete={openDeleteConfirmation}
            />
          ))}
        </div>
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
