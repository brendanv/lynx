import React, { useState } from "react";
import {
  Button,
  Center,
  Container,
  Group,
  Input,
  Loader,
  Table,
  Text,
  TextInput,
  ActionIcon,
  Menu,
  rem,
  Alert,
} from "@mantine/core";
import {
  IconDots,
  IconCopy,
  IconTrash,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { usePocketBase } from "@/hooks/usePocketBase";
import DrawerDialog from "@/components/DrawerDialog";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

type ApiKey = {
  id: string;
  name: string;
  expires_at: string;
  last_used_at: string;
};

const APIKeys: React.FC = () => {
  usePageTitle("API Keys");
  const { pb, user } = usePocketBase();
  const [newKeyName, setNewKeyName] = useState("");
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [newKeyOpened, { open: openNewKey, close: closeNewKey }] =
    useDisclosure(false);
  const queryClient = useQueryClient();

  const queryKey = ["apiKeys", user?.id];
  const apiKeyQuery = useQuery({
    queryKey,
    queryFn: async () => {
      return await pb.collection("api_keys").getFullList<ApiKey>({
        sort: "-created",
        fields: "id,name,expires_at,last_used_at",
      });
    },
    enabled: !!user,
    staleTime: 60 * 10 * 1000,
    placeholderData: keepPreviousData,
  });

  const addKeyMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const formData = new FormData();
      formData.append("name", name);
      const response = await pb.send("/lynx/generate_api_key", {
        method: "POST",
        body: formData,
      });
      setNewApiKey(response.api_key);
      openNewKey();
      setNewKeyName("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      console.error("Error adding API key:", err);
      notifications.show({ message: "Failed to add API key", color: "red" });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async ({ id }: { id: string | null }) => {
      if (!id) {
        return;
      }
      await pb.collection("api_keys").delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      closeDelete();
      setSelectedKeyId(null);
      notifications.show({
        message: "API key deleted successfully",
        color: "green",
      });
    },
    onError: (err) => {
      console.error("Error deleting API key:", err);
      notifications.show({ message: "Failed to delete API key", color: "red" });
    },
  });

  const extendExpirationMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return await pb
        .collection("api_keys")
        .update(
          id,
          { expires_at: sixMonthsFromNow.toISOString() },
          { fields: "id,name,expires_at,last_used_at" },
        );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, (oldData: ApiKey[]) => {
        return oldData.map((oldKey) => {
          if (oldKey.id === data.id) {
            return data;
          } else {
            return oldKey;
          }
        });
      });
      notifications.show({
        message: "API key expiration extended",
        color: "green",
      });
    },
    onError: (err) => {
      console.error("Error extending API key expiration:", err);
      notifications.show({
        message: "Failed to extend API key expiration",
        color: "red",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        notifications.show({ message: "Copied to clipboard", color: "green" });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        notifications.show({
          message: "Failed to copy to clipboard",
          color: "red",
        });
      },
    );
  };

  if (apiKeyQuery.isPending) {
    return (
      <Container mt="md">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  } else if (apiKeyQuery.isError) {
    return (
      <Container mt="md">
        <Alert>{String(apiKeyQuery.error)}</Alert>
      </Container>
    );
  }

  const apiKeys = apiKeyQuery.data;
  return (
    <Container mt="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addKeyMutation.mutate({ name: newKeyName });
        }}
      >
        <TextInput
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          radius="xl"
          size="md"
          mb="lg"
          placeholder="Add API Key"
          required
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

      {apiKeyQuery.isPlaceholderData && (
        <Center mb="md">
          <Loader />
        </Center>
      )}

      <Table.ScrollContainer minWidth={400}>
        <Table>
          <Table.Caption>{`${apiKeys.length} API Key${apiKeys.length !== 1 ? "s" : ""}`}</Table.Caption>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Expires At</Table.Th>
              <Table.Th>Last Used</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {apiKeys.map((key) => (
              <Table.Tr key={key.id}>
                <Table.Td>{key.name}</Table.Td>
                <Table.Td>{new Date(key.expires_at).toLocaleString()}</Table.Td>
                <Table.Td>
                  {key.last_used_at
                    ? new Date(key.last_used_at).toLocaleString()
                    : "Never"}
                </Table.Td>
                <Table.Td>
                  <Menu>
                    <Menu.Target>
                      <ActionIcon>
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconRefresh size={14} />}
                        onClick={() =>
                          extendExpirationMutation.mutate({ id: key.id })
                        }
                      >
                        Extend Expiration
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        onClick={() => {
                          setSelectedKeyId(key.id);
                          openDelete();
                        }}
                        color="red"
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <DrawerDialog
        open={deleteOpened}
        onClose={closeDelete}
        title="Delete API Key"
      >
        <Text>
          Are you sure you want to delete this API key? This action cannot be
          undone.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={closeDelete}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => deleteKeyMutation.mutate({ id: selectedKeyId })}
          >
            Delete
          </Button>
        </Group>
      </DrawerDialog>

      <DrawerDialog
        open={newKeyOpened}
        onClose={closeNewKey}
        title="New API Key Generated"
      >
        <Text mb="md">
          Please copy your new API key. For security reasons, it won't be
          displayed again.
        </Text>
        <Group>
          <Input value={newApiKey || ""} readOnly style={{ flexGrow: 1 }} />
          <Button onClick={() => newApiKey && copyToClipboard(newApiKey)}>
            <IconCopy size={16} />
            Copy
          </Button>
        </Group>
      </DrawerDialog>
    </Container>
  );
};

export default APIKeys;
