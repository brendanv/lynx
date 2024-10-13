import React, { useState } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import {
  Button,
  Card,
  Container,
  FileInput,
  Progress,
  Alert,
  Text,
  Group,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { usePageTitle } from "@/hooks/usePageTitle";

type ProgressState = {
  tags: number;
  feeds: number;
  feedItems: number;
  links: number;
};

const ImportLynxV1: React.FC = () => {
  usePageTitle('Import')
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    tags: 0,
    feeds: 0,
    feedItems: 0,
    links: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const { pb, user } = usePocketBase();

  const handleImport = async () => {
    if (!file || !user) return;

    setIsImporting(true);
    setError(null);
    setProgress({ tags: 0, feeds: 0, feedItems: 0, links: 0 });

    const worker = new Worker(
      new URL("./importLynxV1.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event) => {
      if (event.data.type === "progress") {
        setProgress((prev) => ({
          ...prev,
          [event.data.category]: event.data.progress,
        }));
      } else if (event.data.type === "error") {
        setError(event.data.error);
      } else if (event.data.type === "complete") {
        notifications.show({
          title: "Import complete!",
          message: "Your feeds, tags, and links have been imported.",
          color: "green",
        });
        setIsImporting(false);
      }
    };

    const fileContent = await file.text();
    worker.postMessage({
      jsonData: fileContent,
      pocketbaseUrl: pb.baseUrl,
      userToken: pb.authStore.token,
      userId: user.id,
    });
  };

  const renderProgressBar = (label: string, value: number) => (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm">{label}</Text>
        <Text size="sm">{value.toFixed(0)}%</Text>
      </Group>
      <Progress value={value} size="sm" radius="xl" />
    </Stack>
  );

  return (
    <Container mt="md">
      <Text size="sm" c="dimmed" mt="md">
        Import your data from a Lynx V1 JSON export file.
      </Text>

      <Stack mt="md" gap="md">
        <Group grow>
          <FileInput
            placeholder="Choose file"
            accept=".json"
            value={file}
            onChange={setFile}
          />
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            loading={isImporting}
          >
            {isImporting ? "Importing..." : "Start Import"}
          </Button>
        </Group>

        {isImporting && (
          <Card withBorder radius="md" p="md">
            <Stack gap="md">
              {renderProgressBar("Tags", progress.tags)}
              {renderProgressBar("Feeds", progress.feeds)}
              {renderProgressBar("Feed Items", progress.feedItems)}
              {renderProgressBar("Links", progress.links)}
            </Stack>
          </Card>
        )}

        {error && (
          <Alert title="Error" color="red" radius="md">
            {error}
          </Alert>
        )}
      </Stack>
    </Container>
  );
};

export default ImportLynxV1;
