import { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  TextInput,
  Textarea,
  Title,
  Button,
  Container,
  Stack,
  Alert,
  Center,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import useLinkViewerQuery, {
  useLinkViewerMutation,
} from "@/hooks/useLinkViewerQuery";
import { usePageTitle } from "@/hooks/usePageTitle";
import LynxShell from "@/pages/LynxShell";
import LinkTagsDisplay from "@/components/LinkTagsDisplay";

const EditLink = () => {
  const { id } = useParams<{ id: string }>();
  usePageTitle("Edit Link");

  const linkQuery = useLinkViewerQuery(id || "", false);
  const link = linkQuery.data;
  const linkMutation = useLinkViewerMutation();

  const form = useForm({
    initialValues: {
      title: "",
      excerpt: "",
      summary: "",
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
        summary: link.summary || "",
        article_date: link.article_date
          ? link.article_date.toISOString().split("T")[0]
          : "",
      });
      form.resetDirty();
    }
  }, [link]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!link) return;
    linkMutation.mutate({
      id: link.id,
      updates: {
        title: values.title,
        excerpt: values.excerpt,
        summary: values.summary,
        article_date: values.article_date || null,
      },
      options: {
        onSuccessMessage: "Your changes have been saved",
        afterSuccess: form.resetDirty,
        onErrorMessage: "Unexpected error",
      },
    });
  };

  if (linkQuery.isPending)
    return (
      <LynxShell>
        <Container size="sm">
          <Center>
            <Loader />
          </Center>
        </Container>
      </LynxShell>
    );

  if (linkQuery.isError) {
    return (
      <LynxShell>
        <Container size="sm">
          <Alert color="red" title="Error">
            {linkQuery.error.message}
          </Alert>
        </Container>
      </LynxShell>
    );
  }

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
            <TextInput
              label="Article Date"
              type="date"
              size="md"
              {...form.getInputProps("article_date")}
            />
            <LinkTagsDisplay
              link={linkQuery.data}
              linkMutator={linkMutation}
              size="md"
            />
            <Textarea
              label="Excerpt"
              {...form.getInputProps("excerpt")}
              size="md"
              minRows={3}
              maxRows={6}
              resize="vertical"
              autosize
            />
            <Textarea
              label="Summary"
              {...form.getInputProps("summary")}
              size="md"
              minRows={3}
              maxRows={6}
              resize="vertical"
              autosize
            />
            <Button
              type="submit"
              fullWidth
              disabled={!form.isDirty() || linkMutation.isPending}
              loading={linkMutation.isPending}
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
