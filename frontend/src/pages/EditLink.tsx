import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import { notifications } from "@mantine/notifications";
import {
  TextInput,
  Textarea,
  Title,
  Button,
  Text,
  Container,
  Stack,
  Alert,
  Center,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import useLinkViewerQuery from "@/hooks/useLinkViewerQuery";
import { usePageTitle } from "@/hooks/usePageTitle";
import LynxShell from "@/pages/LynxShell";
import LinkTagsDisplay from "@/components/LinkTagsDisplay";

const EditLink = () => {
  const { id } = useParams<{ id: string }>();
  const { pb } = usePocketBase();
  usePageTitle("Edit Link");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    result: link,
    loading,
    error,
    refetch,
  } = useLinkViewerQuery(id || "", false);

  const form = useForm({
    initialValues: {
      title: "",
      excerpt: "",
      article_date: "",
    },
    validate: {
      title: (value) => (value.trim().length > 0 ? null : "Title is required"),
    },
  });

  useEffect(() => {
    if (link) {
      form.setValues({
        title: link.title || "",
        excerpt: link.excerpt || "",
        article_date: link.article_date
          ? link.article_date.toISOString().split("T")[0]
          : "",
      });
      form.resetDirty();
    }
  }, [link]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!link) return;

    setIsSubmitting(true);
    try {
      await pb.collection("links").update(link.id, {
        title: values.title,
        excerpt: values.excerpt,
        article_date: values.article_date || null,
      });
      notifications.show({
        message: "Link updated successfully",
        color: "green",
      });
      if (refetch) await refetch();
      form.resetDirty();
    } catch (error) {
      console.error("Error updating link:", error);
      notifications.show({
        message: "Failed to update link",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <LynxShell>
        <Container size="sm">
          <Center>
            <Loader />
          </Center>
        </Container>
      </LynxShell>
    );

  if (error && !link) {
    return (
      <LynxShell>
        <Container size="sm">
          <Alert color="red" title="Error">
            {error.message}
          </Alert>
        </Container>
      </LynxShell>
    );
  }

  if (!link) return <Text>Link not found</Text>;

  return (
    <LynxShell>
      <Container size="sm">
        <Title mb="md" order={2}>
          Edit Link
        </Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Title"
              {...form.getInputProps("title")}
              size="md"
            />
            <Textarea
              label="Excerpt"
              {...form.getInputProps("excerpt")}
              size="md"
            />
            <TextInput
              label="Article Date"
              type="date"
              size="md"
              {...form.getInputProps("article_date")}
            />
            <LinkTagsDisplay link={link} refetch={refetch} allowEdits size="md" />
            <Button
              type="submit"
              fullWidth
              disabled={!form.isDirty() || isSubmitting}
              loading={isSubmitting}
              size="md"
            >
              Update Link
            </Button>
          </Stack>
        </form>
      </Container>
    </LynxShell>
  );
};

export default EditLink;
