import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Container,
  Group,
  Input,
  Modal,
  Table,
  Text,
  TextInput,
  ActionIcon,
  Menu,
  Drawer,
  rem,
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

type ApiKey = {
  id: string;
  name: string;
  expires_at: string;
  last_used_at: string;
};

const APIKeys: React.FC = () => {
  const { pb } = usePocketBase();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [newKeyOpened, { open: openNewKey, close: closeNewKey }] =
    useDisclosure(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const records = await pb.collection("api_keys").getFullList<ApiKey>({
        sort: "-created",
        fields: "id,name,expires_at,last_used_at",
      });
      setApiKeys(records);
    } catch (err) {
      console.error("Error fetching API keys:", err);
      notifications.show({ message: "Failed to fetch API keys", color: "red" });
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newKeyName);
      const response = await pb.send("/lynx/generate_api_key", {
        method: "POST",
        body: formData,
      });
      setNewKeyName("");
      fetchApiKeys();
      setNewApiKey(response.api_key);
      openNewKey();
    } catch (err) {
      console.error("Error adding API key:", err);
      notifications.show({ message: "Failed to add API key", color: "red" });
    }
  };

  const handleDeleteApiKey = async () => {
    if (!selectedKeyId) return;
    try {
      await pb.collection("api_keys").delete(selectedKeyId);
      fetchApiKeys();
      closeDelete();
      setSelectedKeyId(null);
      notifications.show({
        message: "API key deleted successfully",
        color: "green",
      });
    } catch (err) {
      console.error("Error deleting API key:", err);
      notifications.show({ message: "Failed to delete API key", color: "red" });
    }
  };

  const handleExtendExpiration = async (id: string) => {
    try {
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      await pb.collection("api_keys").update(id, {
        expires_at: sixMonthsFromNow.toISOString(),
      });
      fetchApiKeys();
      notifications.show({
        message: "API key expiration extended",
        color: "green",
      });
    } catch (err) {
      console.error("Error extending API key expiration:", err);
      notifications.show({
        message: "Failed to extend API key expiration",
        color: "red",
      });
    }
  };

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

  return (
    <Container mt="md">
      <form onSubmit={handleAddApiKey}>
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
                        onClick={() => handleExtendExpiration(key.id)}
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
          <Button color="red" onClick={handleDeleteApiKey}>
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
