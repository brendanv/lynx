import React, { useEffect } from "react";
import {
  Button,
  Container,
  Group,
  Switch,
  TextInput,
  Select,
  Text,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { usePocketBase } from "@/hooks/usePocketBase";
import { usePageTitle } from "@/hooks/usePageTitle";

const General: React.FC = () => {
  usePageTitle("Settings");
  const { pb, user } = usePocketBase();
  const form = useForm({
    initialValues: {
      openai_api_key: "",
      anthropic_api_key: "",
      automatically_summarize_new_links: false,
      summarization_model: "",
      id: "",
    },
  });
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const record = await pb
        .collection("user_settings")
        .getFirstListItem(`user="${user.id}"`);
      form.setValues({
        openai_api_key: record.openai_api_key || "",
        anthropic_api_key: record.anthropic_api_key || "",
        automatically_summarize_new_links:
          record.automatically_summarize_new_links || false,
        summarization_model: record.summarization_model || "",
        id: record.id,
      });
      form.resetDirty();
    } catch (error: any) {
      if (error.status === 404) {
        try {
          const newRecord = await pb.collection("user_settings").create({
            user: user.id,
          });
          form.setValues(newRecord);
          form.resetDirty();
        } catch (createError) {
          console.error("Error creating settings:", createError);
          notifications.show({
            message: "Failed to create settings. Please try again.",
            color: "red",
          });
        }
      } else {
        console.error("Error fetching settings:", error);
        notifications.show({
          message: "Failed to load settings. Please try again.",
          color: "red",
        });
      }
    }
  };

  const handleSubmit = form.onSubmit(async (values) => {
    setIsLoading(true);
    try {
      await pb.collection("user_settings").update(values.id, values);
      notifications.show({
        message: "Settings updated successfully",
        color: "green",
      });
      form.resetDirty();
    } catch (error) {
      console.error("Error updating settings:", error);
      notifications.show({
        message: "Failed to update settings. Please try again.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  });

  if (!user) {
    return (
      <Container mt="md">
        <Text>Please log in to view settings.</Text>
      </Container>
    );
  }

  return (
    <Container mt="md">
      <Paper p="md" radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="OpenAI API Key"
            type="password"
            {...form.getInputProps("openai_api_key")}
            mb="md"
            size="md"
          />
          <TextInput
            label="Anthropic API Key"
            type="password"
            {...form.getInputProps("anthropic_api_key")}
            mb="md"
            size="md"
          />
          <Group mb="md">
            <Switch
              label="Automatically summarize new links"
              {...form.getInputProps("automatically_summarize_new_links", {
                type: "checkbox",
              })}
              size="md"
            />
          </Group>
          <Select
            label="Summarization Model"
            size="md"
            data={[
              { value: "gpt-4o-mini", label: "GPT-4O Mini" },
              { value: "gpt-4o", label: "GPT-4O" },
              { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
              {
                value: "claude-3-5-sonnet-20240620",
                label: "Claude 3.5 Sonnet",
              },
              { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
            ]}
            {...form.getInputProps("summarization_model")}
            mb="md"
          />
          <Button
            type="submit"
            disabled={!form.isDirty()}
            loading={isLoading}
            size="md"
          >
            Save Settings
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default General;
