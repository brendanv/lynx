import { useCreateNewTagMutation } from "@/hooks/useAllUserTags";
import { useForm } from "@mantine/form";
import { ActionIcon, TextInput, rem } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Tag from "@/types/Tag";

interface CreateNewTagInputProps {
  onTagCreated?: (tag: Tag) => void;
}

const CreateNewTagInput = ({ onTagCreated }: CreateNewTagInputProps) => {
  const form = useForm({
    initialValues: {
      tagName: "",
    },
    validate: {
      tagName: (value: string) =>
        value.trim().length > 0 ? null : "Tag name is required",
    },
  });
  const createMutation = useCreateNewTagMutation();

  const handleAdd = ({ tagName }: { tagName: string }) => {
    createMutation.mutate(
      {
        fields: { tagName },
        options: {
          onSuccessMessage: "Tag away!",
          onErrorMessage: "Please try again",
        },
      },
      {
        onSuccess: (newlyCreatedTag) => {
          form.reset();
          if (onTagCreated) {
            onTagCreated(newlyCreatedTag);
          }
        },
      },
    );
  };

  return (
    <form onSubmit={form.onSubmit(handleAdd as any)}>
      <TextInput
        radius="xl"
        size="md"
        mb="lg"
        placeholder="Add tag"
        {...form.getInputProps("tagName")}
        rightSectionWidth={42}
        rightSection={
          <ActionIcon type="submit" size={32} radius="xl" variant="filled">
            <IconPlus
              style={{ width: rem(18), height: rem(18) }}
              stroke={1.5}
            />
          </ActionIcon>
        }
      />
    </form>
  );
};

export default CreateNewTagInput;
