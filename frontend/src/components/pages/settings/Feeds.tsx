import React, { useState, useEffect } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import PageWithHeader from "@/components/pages/PageWithHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Settings } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { usePageTitle } from "@/hooks/usePageTitle";
import SettingsBase from "@/components/pages/settings/SettingsBase";

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
  const [newFeed, setNewFeed] = useState({ name: "", feed_url: "" });
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
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
      await pb.collection("feeds").create(newFeed);
      setNewFeed({ name: "", feed_url: "" });
      fetchFeeds();
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding feed:", err);
      setError("Failed to add feed. Please try again.");
    }
  };

  const handleDeleteFeed = async (id: string) => {
    try {
      await pb.collection("feeds").delete(id);
      fetchFeeds();
    } catch (err) {
      console.error("Error deleting feed:", err);
      setError("Failed to delete feed. Please try again.");
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

  const columns: ColumnDef<Feed>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "feed_url",
      header: "URL",
    },
    {
      accessorKey: "last_fetched_at",
      header: "Last Fetched",
      cell: ({ row }) =>
        new Date(row.getValue("last_fetched_at")).toLocaleString(),
    },
    {
      accessorKey: "auto_add_feed_items_to_library",
      header: "Auto Add",
      cell: ({ row }) => (
        <Switch
          checked={row.getValue("auto_add_feed_items_to_library")}
          onCheckedChange={() =>
            handleToggleAutoAdd(
              row.original.id,
              row.getValue("auto_add_feed_items_to_library"),
            )
          }
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleDeleteFeed(row.original.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: feeds,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

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
                      <label htmlFor="name" className="text-right">
                        Name
                      </label>
                      <Input
                        id="name"
                        value={newFeed.name}
                        onChange={(e) =>
                          setNewFeed({ ...newFeed, name: e.target.value })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="url" className="text-right">
                        URL
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
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </SettingsBase>
    </PageWithHeader>
  );
};

export default Feeds;
