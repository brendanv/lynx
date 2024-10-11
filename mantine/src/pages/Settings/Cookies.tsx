import React, { useState, useEffect } from "react";
import {
  Button,
  Center,
  Container,
  Group,
  Loader,
  TextInput,
  Table,
  Text,
  ActionIcon,
  Menu,
} from "@mantine/core";
import { IconDots, IconTrash, IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { usePocketBase } from "@/hooks/usePocketBase";
import DrawerDialog from "@/components/DrawerDialog";

type Cookie = {
  id: string;
  domain: string;
  name: string;
  created: string;
};

const Cookies: React.FC = () => {
  const { pb, user } = usePocketBase();
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [cookiesLoading, setCookiesLoading] = useState(true);
  const [newCookie, setNewCookie] = useState({
    domain: "",
    name: "",
    value: "",
  });
  const [selectedCookieId, setSelectedCookieId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  useEffect(() => {
    fetchCookies();
  }, []);

  const fetchCookies = async () => {
    setCookiesLoading(true);
    try {
      const records = await pb.collection("user_cookies").getFullList<Cookie>({
        sort: "-created",
        fields: "id,domain,name,created",
      });
      setCookies(records);
    } catch (err) {
      console.error("Error fetching cookies:", err);
      notifications.show({ message: "Failed to fetch cookies", color: "red" });
    } finally {
      setCookiesLoading(false);
    }
  };

  const handleAddCookie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pb.collection("user_cookies").create({
        ...newCookie,
        user: user?.id,
      });
      setNewCookie({ domain: "", name: "", value: "" });
      fetchCookies();
      notifications.show({
        message: "Cookie added successfully",
        color: "green",
      });
    } catch (err) {
      console.error("Error adding cookie:", err);
      notifications.show({ message: "Failed to add cookie", color: "red" });
    }
  };

  const handleDeleteCookie = async () => {
    if (!selectedCookieId) return;
    try {
      await pb.collection("user_cookies").delete(selectedCookieId);
      fetchCookies();
      closeDelete();
      setSelectedCookieId(null);
      notifications.show({
        message: "Cookie deleted successfully",
        color: "green",
      });
    } catch (err) {
      console.error("Error deleting cookie:", err);
      notifications.show({ message: "Failed to delete cookie", color: "red" });
    }
  };

  return (
    <Container mt="md">
      <form onSubmit={handleAddCookie}>
        <Group mb="lg">
          <TextInput
            value={newCookie.domain}
            onChange={(e) =>
              setNewCookie({ ...newCookie, domain: e.target.value })
            }
            placeholder="Domain"
            required
          />
          <TextInput
            value={newCookie.name}
            onChange={(e) =>
              setNewCookie({ ...newCookie, name: e.target.value })
            }
            placeholder="Name"
            required
          />
          <TextInput
            value={newCookie.value}
            onChange={(e) =>
              setNewCookie({ ...newCookie, value: e.target.value })
            }
            placeholder="Value"
            required
          />
          <Button type="submit" leftSection={<IconPlus size={14} />}>
            Add Cookie
          </Button>
        </Group>
      </form>

      {cookiesLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <Table.ScrollContainer minWidth={400}>
          <Table>
            <Table.Caption>{`${cookies.length} Cookie${cookies.length !== 1 ? "s" : ""}`}</Table.Caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Created</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Domain</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {cookies.map((cookie) => (
                <Table.Tr key={cookie.id}>
                  <Table.Td>
                    {new Date(cookie.created).toLocaleString()}
                  </Table.Td>
                  <Table.Td>{cookie.name}</Table.Td>
                  <Table.Td>{cookie.domain}</Table.Td>
                  <Table.Td>
                    <Menu>
                      <Menu.Target>
                        <ActionIcon>
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          onClick={() => {
                            setSelectedCookieId(cookie.id);
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
      )}

      <DrawerDialog
        open={deleteOpened}
        onClose={closeDelete}
        title="Delete Cookie"
      >
        <Text>
          Are you sure you want to delete this cookie? This action cannot be
          undone.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={closeDelete}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteCookie}>
            Delete
          </Button>
        </Group>
      </DrawerDialog>
    </Container>
  );
};

export default Cookies;
