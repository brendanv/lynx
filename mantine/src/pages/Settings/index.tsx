import { lazy } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, Title } from "@mantine/core";
import LynxShell from "@/pages/LynxShell";

const APIKeys = lazy(() => import("./APIKeys"));

const TabsToTitles: {[key: string]: string} = {
  api_keys: "Settings - Manage API Keys",
  cookies: "Settings - Manage Cookies",
  tags: "Settings - Manage Tags",
  import: "Settings - Import",
  general: "Settings"
};

const Settings = () => {
  const navigate = useNavigate();
  const { tabValue } = useParams();

  return (
    <LynxShell>
      <Title mb="lg">
        {TabsToTitles[(tabValue || "")] || "User Settings"}
      </Title>
      <Tabs
        value={tabValue}
        onChange={(value) => navigate(`/settings/${value}`)}
        keepMounted={false}
      >
        <Tabs.List>
          <Tabs.Tab value="api_keys">API Keys</Tabs.Tab>
          <Tabs.Tab value="tags">Tags</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="api_keys">
          <APIKeys />
        </Tabs.Panel>
        <Tabs.Panel value="tags">Tags</Tabs.Panel>
      </Tabs>
    </LynxShell>
  );
};

export default Settings;
