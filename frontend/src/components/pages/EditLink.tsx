import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagsMultiSelect from "@/components/TagsMultiSelect";
import useLinkViewerQuery from "@/hooks/useLinkViewerQuery";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PageWithHeader from "@/components/pages/PageWithHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const EditLink: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { pb } = usePocketBase();
  const { toast } = useToast();
  usePageTitle("Edit Link");

  const {
    result: link,
    loading,
    error,
    refetch,
  } = useLinkViewerQuery(id || "", false);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [articleDate, setArticleDate] = useState("");

  useEffect(() => {
    if (link) {
      setTitle(link.title || "");
      setExcerpt(link.excerpt || "");
      setArticleDate(
        link.article_date ? link.article_date.toISOString().split("T")[0] : "",
      );
    }
  }, [link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    try {
      await pb.collection("links").update(link.id, {
        title,
        excerpt,
        article_date: articleDate || null,
      });
      toast({
        title: "Success",
        description: "Link updated successfully",
      });
      if (refetch) await refetch();
    } catch (error) {
      console.error("Error updating link:", error);
      toast({
        title: "Error",
        description: "Failed to update link",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  if (error && !link) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!link) return <div>Link not found</div>;

  return (
    <PageWithHeader>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Edit Link</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="excerpt"
                className="block text-sm font-medium text-gray-700"
              >
                Excerpt
              </label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="articleDate"
                className="block text-sm font-medium text-gray-700"
              >
                Article Date
              </label>
              <Input
                id="articleDate"
                type="date"
                value={articleDate}
                onChange={(e) => setArticleDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <TagsMultiSelect link={link} refetch={null} />
            </div>
            <Button type="submit">Update Link</Button>
          </form>
        </CardContent>
      </Card>
    </PageWithHeader>
  );
};

export default EditLink;
