import React, { useState, useEffect } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MoreHorizontal, ArrowUpDown, Copy } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageWithHeader from "@/components/pages/PageWithHeader";
import SettingsBase from "@/components/pages/settings/SettingsBase";

type ApiKey = {
  id: string;
  name: string;
  expires_at: string;
  last_used_at: string;
};

const ApiKeys: React.FC = () => {
  const { pb } = usePocketBase();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [isNewKeyDialogOpen, setIsNewKeyDialogOpen] = useState(false);
  usePageTitle("API Keys");

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const records = await pb.collection("api_keys").getFullList<ApiKey>({
        sort: "-created",
        fields: "id,name,expires_at,last_used_at",
      });
      setApiKeys(records);
    } catch (err) {
      console.error("Error fetching API keys:", err);
      setError("Failed to fetch API keys. Please try again.");
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newKeyName);
      const response = await pb.send("/lynx/generate_api_key", {
        method: "POST",
        body: formData,
      });
      setNewKeyName("");
      fetchApiKeys();
      setNewApiKey(response.api_key);
      setIsNewKeyDialogOpen(true);
    } catch (err) {
      console.error("Error adding API key:", err);
      setError("Failed to add API key. Please try again.");
    }
  };

  const handleDeleteApiKey = async () => {
    if (!actionId) return;
    try {
      await pb.collection("api_keys").delete(actionId);
      fetchApiKeys();
      setIsDeleteDialogOpen(false);
      setActionId(null);
    } catch (err) {
      console.error("Error deleting API key:", err);
      setError("Failed to delete API key. Please try again.");
    }
  };

  const handleExtendExpiration = async () => {
    if (!actionId) return;
    try {
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      await pb.collection("api_keys").update(actionId, {
        expires_at: sixMonthsFromNow.toISOString(),
      });
      fetchApiKeys();
      setActionId(null);
    } catch (err) {
      console.error("Error extending API key expiration:", err);
      setError("Failed to extend API key expiration. Please try again.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // You could add a toast notification here to confirm the copy action
        console.log("Copied to clipboard");
      },
      (err) => {
        console.error("Could not copy text: ", err);
      },
    );
  };

  const columns: ColumnDef<ApiKey>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "expires_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expires At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.getValue("expires_at")).toLocaleString(),
    },
    {
      accessorKey: "last_used_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Used
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) =>
        row.getValue("last_used_at")
          ? new Date(row.getValue("last_used_at")).toLocaleString()
          : "Never",
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
            <DropdownMenuItem
              onClick={() => {
                setActionId(row.original.id);
                handleExtendExpiration();
              }}
            >
              Extend Expiration
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setActionId(row.original.id);
                setIsDeleteDialogOpen(true);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: apiKeys,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const keyToDelete = apiKeys.find((key) => key.id === actionId);

  return (
    <PageWithHeader>
      <SettingsBase>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddApiKey} className="space-y-4">
              <Input
                placeholder="API Key Name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
              />
              <Button type="submit">Generate API Key</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing API Keys</CardTitle>
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
      
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the API
              key:
              <br />
              <strong>Name:</strong> {keyToDelete?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteApiKey}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isNewKeyDialogOpen} onOpenChange={setIsNewKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New API Key Generated</DialogTitle>
            <DialogDescription>
              Please copy your new API key. For security reasons, it won't be
              displayed again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={newApiKey || ""} readOnly className="flex-grow" />
            <Button
              onClick={() => newApiKey && copyToClipboard(newApiKey)}
              className="flex-shrink-0"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWithHeader>
  );
};

export default ApiKeys;
