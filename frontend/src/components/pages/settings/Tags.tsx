import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import PageWithHeader from "@/components/pages/PageWithHeader";
import SettingsBase from "@/components/pages/settings/SettingsBase";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ExternalLink, Trash2 } from "lucide-react";
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
import URLS from "@/lib/urls";

const Tags: React.FC = () => {
  const { pb, user } = usePocketBase();
  const { toast } = useToast();
  const [tags, setTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<any>(null);
  usePageTitle("Tags");

  useEffect(() => {
    fetchTags();
  }, [pb, user, sortField, sortDirection]);

  const fetchTags = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const records = await pb.collection("tags_metadata").getFullList({
        sort: `${sortDirection === "desc" ? "-" : ""}${sortField}`,
        filter: `user="${user.id}"`,
      });
      setTags(records);
    } catch (error) {
      console.error("Error fetching tags:", error);
      setError("Failed to load tags. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const slug = generateSlug(newTagName);
      await pb.collection("tags").create({
        name: newTagName,
        slug: slug,
        user: user?.id,
      });
      setNewTagName("");
      toast({ description: "Tag created successfully" });
      fetchTags();
    } catch (error) {
      console.error("Error creating tag:", error);
      setError("Failed to create tag. Please try again.");
    }
  };

  const handleDeleteClick = (tag: any) => {
    setTagToDelete(tag);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;

    try {
      await pb.collection("tags").delete(tagToDelete.id);
      toast({ description: "Tag deleted successfully" });
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      setError("Failed to delete tag. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view tags.</div>;

  return (
    <PageWithHeader>
      <SettingsBase>
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <Input
                placeholder="Tag Name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                required
              />
              <Button type="submit">Create Tag</Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                    Name <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                  </TableHead>
                  <TableHead onClick={() => handleSort("link_count")} className="cursor-pointer">
                    Link Count <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>{tag.name}</TableCell>
                    <TableCell>{tag.link_count}</TableCell>
                    <TableCell>
                      <div className="flex justify-start space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="hidden sm:inline-flex"
                        >
                          <Link to={URLS.HOME_WITH_TAGS_SEARCH(tag.id)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Links
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="sm:hidden"
                        >
                          <Link to={URLS.HOME_WITH_TAGS_SEARCH(tag.id)}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View Links</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(tag)}
                          className="hidden sm:inline-flex"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(tag)}
                          className="sm:hidden"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </SettingsBase>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the tag "{tagToDelete?.name}" from {tagToDelete?.link_count} links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWithHeader>
  );
};

export default Tags;