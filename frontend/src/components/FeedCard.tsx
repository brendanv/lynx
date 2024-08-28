import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FeedCardProps = {
  feed: any;
  onToggleAutoAdd: (id: string, currentValue: boolean) => void;
  onDelete: (id: string) => void;
};

const FeedCard: React.FC<FeedCardProps> = ({
  feed,
  onToggleAutoAdd,
  onDelete,
}) => {
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-start gap-4">
        <img
          src={feed.image_url || "/img/lynx_placeholder.png"}
          alt={feed.name}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="flex-grow">
          <CardTitle>{feed.name}</CardTitle>
          <CardDescription>{feed.feed_url}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDelete(feed.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="mb-2">{feed.description}</p>
        <div className="flex items-center justify-between">
          <span>Auto add to library</span>
          <Switch
            checked={feed.auto_add_feed_items_to_library}
            onCheckedChange={() =>
              onToggleAutoAdd(feed.id, feed.auto_add_feed_items_to_library)
            }
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Last fetched: {new Date(feed.last_fetched_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default FeedCard;
