import { lazy } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, Title } from "@mantine/core";
import LynxShell from "@/pages/LynxShell";

const APIKeys = lazy(() => import("./APIKeys"));
const Tags = lazy(() => import("./Tags"));
const Cookies = lazy(() => import("./Cookies"));
const General = lazy(() => import("./General"));
const Feeds = lazy(() => import("./Feeds"));
const Import = lazy(() => import("./Import"));

const TabsToTitles: { [key: string]: string } = {
  api_keys: "Manage API Keys",
  cookies: "Manage Cookies",
  tags: "Manage Tags",
  import: "Import",
  general: "Settings",
};

const Settings = () => {
  const navigate = useNavigate();
  const { tabValue } = useParams();

  return (
    <LynxShell>
      <Title mb="lg">{TabsToTitles[tabValue || ""] || "User Settings"}</Title>
      <Tabs
        value={tabValue}
        onChange={(value) => navigate(`/settings/${value}`)}
        keepMounted={false}
      >
        <Tabs.List>
          <Tabs.Tab value="general">Settings</Tabs.Tab>
          <Tabs.Tab value="tags">Tags</Tabs.Tab>
          <Tabs.Tab value="feeds">Feeds</Tabs.Tab>
          <Tabs.Tab value="cookies">Cookies</Tabs.Tab>
          <Tabs.Tab value="api_keys">API Keys</Tabs.Tab>
          <Tabs.Tab value="import">Import</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="api_keys">
          <APIKeys />
        </Tabs.Panel>
        <Tabs.Panel value="tags">
          <Tags />
        </Tabs.Panel>
        <Tabs.Panel value="cookies">
          <Cookies />
        </Tabs.Panel>
        <Tabs.Panel value="general">
          <General />
        </Tabs.Panel>
        <Tabs.Panel value="feeds">
          <Feeds />
        </Tabs.Panel>
        <Tabs.Panel value="import">
          <Import />
        </Tabs.Panel>
      </Tabs>
    </LynxShell>
  );
};

export default Settings;
