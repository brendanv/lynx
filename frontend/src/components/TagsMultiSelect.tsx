import React, { useState, useEffect } from "react";
import MultipleSelector, { Option } from "@/components/ui/multi-select";
import useAllUserTags from "@/hooks/useAllUserTags";
import { usePocketBase } from "@/hooks/usePocketBase";
import { useToast } from "@/components/ui/use-toast";
import type FeedLink from "@/types/FeedLink";
import type { LinkView } from "@/hooks/useLinkViewerQuery";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TagsMultiSelectProps {
  link: FeedLink | LinkView;
  refetch: (() => Promise<void>) | null;
  asDialog?: boolean;
}

const TagsMultiSelect: React.FC<TagsMultiSelectProps> = ({
  link,
  refetch,
  asDialog = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  if (!asDialog) {
    return <TagsMultiSelector link={link} refetch={refetch} />;
  }

  // Don't use DrawerDialog because the typeahead runs of the bottom
  // of the screen and isn't usable.
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Edit Tags
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tags</DialogTitle>
          <DialogDescription>Edit the tags for {link.title}</DialogDescription>
        </DialogHeader>
        <TagsMultiSelect link={link} refetch={refetch} />
      </DialogContent>
    </Dialog>
  );
};

const TagsMultiSelector: React.FC<Omit<TagsMultiSelectProps, "asDialog">> = ({
  link,
  refetch,
}) => {
  const { pb } = usePocketBase();
  const { toast } = useToast();
  const { tags: allTags, loading } = useAllUserTags();
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option[]>([]);

  useEffect(() => {
    if (allTags) {
      setOptions(
        allTags.map((tag) => ({
          value: tag.id,
          label: tag.name,
        })),
      );
    }
  }, [allTags]);

  const linkSelectedTags = link.tags.map((tag) => tag.id);
  useEffect(() => {
    const selectedOptions = options.filter((option) =>
      linkSelectedTags.includes(option.value),
    );
    setSelected(selectedOptions);
  }, [link, options]);

  const handleChange = async (newSelected: Option[]) => {
    setSelected(newSelected);
    const newTagIds = newSelected.map((option) => option.value);

    try {
      await pb.collection("links").update(link.id, {
        tags: newTagIds,
      });
      if (refetch) {
        refetch();
      }
    } catch (error) {
      console.error("Error updating tags:", error);
      toast({
        description: "Failed to update tags. Please try again.",
        variant: "destructive",
      });
      setSelected(selected);
    }
  };

  if (loading) return <div>Loading tags...</div>;

  return (
    <MultipleSelector
      value={selected}
      onChange={handleChange}
      options={options}
      placeholder="Select tags"
      emptyIndicator={<p className="text-center">No tags found.</p>}
    />
  );
};

export default TagsMultiSelect;
