import { Badge, Group, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type FeedLink from "@/types/FeedLink";
import type { LinkView } from "@/hooks/useLinkViewerQuery";
import DrawerDialog from "@/components/DrawerDialog";
import TagsEditor from "@/components/TagsEditor";

interface Props {
  link: FeedLink | LinkView;
  refetch: (() => Promise<void>) | null;
}

const LinkTagsDisplay = ({ link, refetch }: Props) => {
  const [isEditOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  return (
    <Group>
      {link.tags.map((tag) => (
        <Badge
          key={tag.id}
          size="xs"
          variant="gradient"
          gradient={{ from: "blue", to: "cyan", deg: 90 }}
        >
          {tag.name}
        </Badge>
      ))}
      <Button size="xs" variant="subtle" onClick={openEdit}>
        Edit Tags
      </Button>
      <DrawerDialog title="Edit Tags" open={isEditOpen} onClose={closeEdit}>
        <TagsEditor link={link} refetch={refetch} />
      </DrawerDialog>
    </Group>
  );
};

export default LinkTagsDisplay;
