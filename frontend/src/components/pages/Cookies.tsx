import React, { useState, useEffect } from 'react';
import { usePocketBase } from "@/hooks/usePocketBase";
import Header from "@/components/Header";
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
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";

type Cookie = {
  id: string;
  domain: string;
  name: string;
  created: string;
};

const Cookies: React.FC = () => {
  const { pb, user } = usePocketBase();
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [newCookie, setNewCookie] = useState({ domain: '', name: '', value: ''});
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    fetchCookies();
  }, []);

  const fetchCookies = async () => {
    try {
      const records = await pb.collection('user_cookies').getFullList<Cookie>({
        sort: '-created',
        fields: 'id,domain,name,created',
      });
      setCookies(records);
    } catch (err) {
      console.error('Error fetching cookies:', err);
      setError('Failed to fetch cookies. Please try again.');
    }
  };

  const handleAddCookie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pb.collection('user_cookies').create({
        ...newCookie,
        user: user?.id,
      });
      setNewCookie({ domain: '', name: '', value: '' });
      fetchCookies();
    } catch (err) {
      console.error('Error adding cookie:', err);
      setError('Failed to add cookie. Please try again.');
    }
  };

  const handleDeleteCookie = async () => {
    if (!deleteId) return;
    try {
      await pb.collection('user_cookies').delete(deleteId);
      fetchCookies();
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting cookie:', err);
      setError('Failed to delete cookie. Please try again.');
    }
  };

  const columns: ColumnDef<Cookie>[] = [
    {
      accessorKey: "created",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => new Date(row.getValue("created")).toLocaleString(),
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "domain",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Domain
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
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
                setDeleteId(row.original.id);
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
    data: cookies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const cookieToDelete = cookies.find(cookie => cookie.id === deleteId);

  return (
    <>
      <Header />
      <main className="container mx-auto mt-20 p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Cookie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCookie} className="space-y-4">
              <Input
                placeholder="Domain"
                value={newCookie.domain}
                onChange={(e) => setNewCookie({ ...newCookie, domain: e.target.value })}
                required
              />
              <Input
                placeholder="Name"
                value={newCookie.name}
                onChange={(e) => setNewCookie({ ...newCookie, name: e.target.value })}
                required
              />
              <Input
                placeholder="Value"
                value={newCookie.value}
                onChange={(e) => setNewCookie({ ...newCookie, value: e.target.value })}
                required
              />
              <Button type="submit">Add Cookie</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Cookies</CardTitle>
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
                              header.getContext()
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the cookie:
              <br />
              <strong>Domain:</strong> {cookieToDelete?.domain}
              <br />
              <strong>Name:</strong> {cookieToDelete?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCookie}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Cookies;