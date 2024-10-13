import { useState } from "react";
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { usePocketBase } from "@/hooks/usePocketBase";
import parseNewLink from "@/utils/parseNewLink";
import FeedLink from "@/types/FeedLink";
import { Link } from "react-router-dom";
import URLS from "@/lib/urls";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Text,
  Title,
  TextInput,
  Button,
  Alert,
  Container,
  Stack,
} from "@mantine/core";
import LynxShell from "@/pages/LynxShell";

const URLParserForm = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<FeedLink | null>(null);
  const { pb } = usePocketBase();
  usePageTitle("Add Link");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCreatedLink(null);
    setError(null);

    try {
      const newLink = await parseNewLink(url, pb);
      setCreatedLink(newLink);
      setUrl("");
    } catch (e: any) {
      console.log(e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LynxShell>
      <Container size="sm">
        <Stack>
          <Title order={2}>Save a New Link</Title>
          <Text size="md" c="dimmed">
            Download, process, and save article content to read later
          </Text>

          {createdLink && (
            <Alert
              icon={<IconCircleCheck size={16} />}
              title={createdLink.title}
              color="green"
            >
              <Text size="md">{createdLink.excerpt}</Text>
              <Button
                component={Link}
                to={URLS.LINK_VIEWER(createdLink.id)}
                variant="outline"
                color="green"
                size="sm"
                mt="sm"
              >
                Read Now
              </Button>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL"
                disabled={isLoading}
              />
              <Button type="submit" fullWidth loading={isLoading}>
                Parse {createdLink ? "Another " : ""}URL
              </Button>
            </Stack>
          </form>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
            >
              {error}
            </Alert>
          )}
        </Stack>
      </Container>
    </LynxShell>
  );
};

export default URLParserForm;
