import { useSwipeable } from "react-swipeable";
import { useState, useEffect, useRef } from "react";
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
import {
  Archive,
  HardDriveDownloadIcon,
  MoreVertical,
  Trash2,
  Circle,
  CircleCheckBig,
} from "lucide-react";
import { usePocketBase } from "@/hooks/usePocketBase";
import { useToast } from "@/components/ui/use-toast";
const SWIPE_THRESHOLD = 100;
const LinkCard: React.FC<{
  link: FeedLink;
  onUpdate: (() => Promise<void>) | null;
}> = ({ link, onUpdate }) => {
  const { pb } = usePocketBase();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isUnread = link.last_viewed_at === null;
  const { toast } = useToast();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const resetTimerRef = useRef<number | null>(null);
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
  const handleCreateArchive = async () => {
    try {
      await pb.send(`/lynx/link/${link.id}/create_archive`, {
        method: "POST",
      });
      toast({
        description: "Attempting to create archive...",
      });
    } catch (error) {
      console.error("Error creating archive:", error);
      toast({
        title: "Error",
        description: "Failed to create archive",
        variant: "destructive",
      });
    }
  };

  const resetSwipe = () => {
    setSwipeOffset(0);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      if (eventData.dir === "Left" || eventData.dir === "Right") {
        setSwipeOffset(eventData.deltaX);
        if (resetTimerRef.current) {
          clearTimeout(resetTimerRef.current);
        }
        resetTimerRef.current = window.setTimeout(resetSwipe, 3000);
      }
    },
    onSwipedLeft: () => {
      if (swipeOffset < -SWIPE_THRESHOLD) {
        setIsDeleteDialogOpen(true);
      }
      resetSwipe();
    },
    onSwipedRight: () => {
      if (swipeOffset > SWIPE_THRESHOLD) {
        handleToggleUnread();
      }
      resetSwipe();
    },
    onSwiped: resetSwipe,
    trackMouse: true,
  });
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);
  const getBackgroundColor = () => {
    if (swipeOffset > 0) {
      return swipeOffset > SWIPE_THRESHOLD
        ? "rgba(0, 0, 255, 0.9)"
        : "rgba(0, 0, 255, 0.5)";
    } else {
      return swipeOffset < -SWIPE_THRESHOLD
        ? "rgba(255, 0, 0, 0.9)"
        : "rgba(255, 0, 0, 0.5)";
    }
  };
  return (
    <>
      <div
        className="relative w-full overflow-hidden mb-4 rounded-lg"
        {...swipeHandlers}
      >
        <div
          className="absolute inset-0 flex items-center justify-between px-4 text-white rounded-lg"
          style={{
            background: getBackgroundColor(),
            opacity: Math.abs(swipeOffset) / 100,
          }}
        >
          {swipeOffset > 0 ? (
            <span className="mr-auto flex items-center">
              <CircleCheckBig className="mr-2 h-5 w-5" />
              Mark as {isUnread ? "Read" : "Unread"}
            </span>
          ) : (
            <span className="ml-auto flex items-center">
              <Trash2 className="mr-2 h-5 w-5" />
              Delete
            </span>
          )}
        </div>
        <Card
          className="flex items-start p-4 gap-4 relative bg-background"
          style={{ transform: `translateX(${swipeOffset}px)` }}
        >
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
              <Link
                to={URLS.LINK_VIEWER(link.id)}
                className="min-w-0 flex-grow"
              >
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center justify-between line-clamp-2 sm:line-clamp-1">
                    {link.title}
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
                  {link.archive ? (
                    <DropdownMenuItem asChild>
                      <span>
                        <Archive className="mr-2 h-4 w-4" />
                        <Link to={URLS.LINK_ARCHIVE(link.id)}>
                          View Archive
                        </Link>
                      </span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleCreateArchive}>
                      <HardDriveDownloadIcon className="mr-2 h-4 w-4" />
                      Create archive
                    </DropdownMenuItem>
                  )}
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
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              link from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-confirm-button"
              onClick={handleDelete}
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
