import { useState } from "react";
import type FeedLink from "@/types/FeedLink";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import URLS from "@/lib/urls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Trash2, Circle, CircleCheckBig } from "lucide-react";
import { usePocketBase } from "@/hooks/usePocketBase";
import { useToast } from "@/components/ui/use-toast";

const LinkCard: React.FC<{
  link: FeedLink;
  onUpdate: (() => Promise<void>) | null;
}> = ({ link, onUpdate }) => {
  const { pb } = usePocketBase();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isUnread = link.last_viewed_at === null;
  const { toast } = useToast();

  const handleToggleUnread = async () => {
    try {
      const updatedLink = {
        ...link,
        last_viewed_at: isUnread ? new Date().toISOString() : null,
      };
      await pb.collection("links").update(link.id, updatedLink);
      toast({
        title: "Link updated",
        description: `Marked as ${isUnread ? "read" : "unread"}`,
      });
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error("Error toggling unread status:", error);
      toast({
        title: "Error",
        description: "Failed to update link status",
        variant: "destructive",
      });
    }
  };
  const handleDelete = async () => {
    try {
      await pb.collection("links").delete(link.id);
      toast({
        title: "Link deleted",
        description: "The link has been removed from your library",
      });
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error("Error deleting link:", error);
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    }
  };
  return (
    <>
      <Card className="flex items-start p-4 gap-4 mb-4">
        <div className="flex-shrink-0 relative">
          <img
            src={link.header_image_url || "/img/lynx_placeholder.png"}
            alt={link.title || ""}
            className="object-cover w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg"
          />
          {isUnread && (
            <div
              data-testid="unread-indicator"
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"
            ></div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
            <Link to={URLS.LINK_VIEWER(link.id)}>
              <CardHeader className="p-0">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{link.title}</span>
                </CardTitle>
                <CardDescription>{link.hostname}</CardDescription>
              </CardHeader>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="more">
                <MoreVertical className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent role="menu">
                <DropdownMenuItem onClick={handleToggleUnread}>
                  {isUnread ? (
                    <CircleCheckBig className="mr-2 h-4 w-4" />
                  ) : (
                    <Circle className="mr-2 h-4 w-4" />
                  )}
                  Mark as {isUnread ? "Read" : "Unread"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                  aria-label="Delete link"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardContent className="p-0 mt-2">
            <p className="line-clamp-2">{link.excerpt}</p>
          </CardContent>
        </div>
      </Card>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              link:
              <br />
              <strong>{link.title}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="delete-confirm-button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const LinkCardSkeleton: React.FC = () => {
  return (
    <Card className="flex items-start p-4 gap-4 mb-4">
      <Skeleton className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg" />
      <div className="flex-grow min-w-0">
        <CardHeader className="p-0">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="p-0 mt-2">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </div>
    </Card>
  );
};

export default LinkCard;
