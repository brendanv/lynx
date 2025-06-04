import { Badge, Group, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import DrawerDialog from "@/components/DrawerDialog";
import TagsEditor from "@/components/TagsEditor";
import { GenericLynxMutator } from "@/types/Mutations";
import Tag from "@/types/Tag";

interface Taggable {
  id: string;
  tags: Tag[];
  suggested_tags?: Tag[];
}

interface Props {
  link: Taggable;
  linkMutator?: GenericLynxMutator<Taggable>;
  size: "xs" | "sm" | "md" | "lg" | "xl";
}

const LinkTagsDisplay = ({ link, linkMutator, size }: Props) => {
  const [isEditOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const editLabel = link.tags.length === 0 ? "Add Tags" : "Edit Tags";

  const manualTagIds = new Set(link.tags.map((tag) => tag.id));
  const uniqueSuggestedTags =
    link.suggested_tags?.filter((tag) => !manualTagIds.has(tag.id)) || [];

  return (
    <Group>
      {link.tags.map((tag) => (
        <Badge
          key={tag.id}
          size={size}
          variant="gradient"
          gradient={{ from: "blue", to: "cyan", deg: 90 }}
        >
          {tag.name}
        </Badge>
      ))}
      {uniqueSuggestedTags.map((tag) => (
        <Badge
          key={`suggested-${tag.id}`}
          size={size}
          variant="gradient"
          gradient={{ from: "gray", to: "rgba(84, 84, 84, 1)", deg: 0 }}
        >
          {tag.name}
        </Badge>
      ))}
      {linkMutator ? (
        <>
          <Button size={size} variant="subtle" onClick={openEdit}>
            {editLabel}
          </Button>
          <DrawerDialog title={editLabel} open={isEditOpen} onClose={closeEdit}>
            <TagsEditor
              link={link}
              linkMutator={linkMutator}
              afterSave={closeEdit}
            />
          </DrawerDialog>
        </>
      ) : null}
    </Group>
  );
};

export default LinkTagsDisplay;
