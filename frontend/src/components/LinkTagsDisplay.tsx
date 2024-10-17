import { Badge, Group, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type FeedLink from "@/types/FeedLink";
import type { LinkView } from "@/hooks/useLinkViewerQuery";
import DrawerDialog from "@/components/DrawerDialog";
import TagsEditor from "@/components/TagsEditor";
import {GenericLynxMutator} from '@/types/Mutations'

interface Props {
  link: FeedLink | LinkView;
  linkMutator?: GenericLynxMutator<FeedLink | LinkView>;
  size: "xs" | "sm" | "md" | "lg" | "xl";
}

const LinkTagsDisplay = ({ link, linkMutator, size }: Props) => {
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
      {linkMutator ? (
        <>
          <Button size={size} variant="subtle" onClick={openEdit}>
            Edit Tags
          </Button>
          <DrawerDialog title="Edit Tags" open={isEditOpen} onClose={closeEdit}>
            <TagsEditor link={link} linkMutator={linkMutator} />
          </DrawerDialog>
        </>
      ) : null}
    </Group>
  );
};

export default LinkTagsDisplay;
