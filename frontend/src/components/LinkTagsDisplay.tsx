import { Badge, Group, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type FeedLink from "@/types/FeedLink";
import type { LinkView } from "@/hooks/useLinkViewerQuery";
import DrawerDialog from "@/components/DrawerDialog";
import TagsEditor from "@/components/TagsEditor";

interface Props {
  link: FeedLink | LinkView;
  refetch: (() => Promise<void>) | null;
  allowEdits: boolean;
  size: "xs" | "sm" | "md" | "lg" | "xl";
}

const LinkTagsDisplay = ({ link, refetch, allowEdits, size }: Props) => {
  const [isEditOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
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
      {allowEdits ? (
        <>
          <Button size={size} variant="subtle" onClick={openEdit}>
            Edit Tags
          </Button>
          <DrawerDialog title="Edit Tags" open={isEditOpen} onClose={closeEdit}>
            <TagsEditor link={link} refetch={refetch} />
          </DrawerDialog>
        </>
      ) : null}
    </Group>
  );
};

export default LinkTagsDisplay;
