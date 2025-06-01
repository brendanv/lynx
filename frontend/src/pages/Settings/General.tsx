import React, { useEffect } from "react";
import {
  Button,
  Container,
  Group,
  Switch,
  TextInput,
  Text,
  Paper,
  Alert,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { usePocketBase } from "@/hooks/usePocketBase";
import { usePageTitle } from "@/hooks/usePageTitle";

const General: React.FC = () => {
  usePageTitle("Settings");
  const { pb, user } = usePocketBase();
  const form = useForm({
    initialValues: {
      openrouter_api_key: "",
      automatically_summarize_new_links: false,
      summarize_model: "",
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
        openrouter_api_key: record.openrouter_api_key || "",
        automatically_summarize_new_links:
          record.automatically_summarize_new_links || false,
        summarize_model: record.summarize_model || "",
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
            label="OpenRouter API Key"
            type="password"
            {...form.getInputProps("openrouter_api_key")}
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
          {form.values.automatically_summarize_new_links &&
            (!form.values.openrouter_api_key ||
              !form.values.summarize_model) && (
              <Alert
                icon={<IconAlertTriangle size="1rem" />}
                title="Configuration Required"
                color="yellow"
                mb="md"
              >
                Automatic summarizations will not run if there is no OpenRouter
                API key or summarize model set.
              </Alert>
            )}
          <TextInput
            label="Summarization Model"
            {...form.getInputProps("summarize_model")}
            mb="md"
            size="md"
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
