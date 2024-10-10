import React, { ReactNode } from "react";
import {
  Avatar,
  Autocomplete,
  AppShell,
  Burger,
  Group,
  NavLink,
  rem,
  Kbd,
  Text,
} from "@mantine/core";
import { useDisclosure, useHeadroom } from "@mantine/hooks";
import { Link, useLocation } from "react-router-dom";
import {
  IconHome,
  IconLogout,
  IconTags,
  IconRss,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import LynxLogo from "@/components/LynxLogo";
import URLS from "@/lib/urls";
import classes from "./LynxShell.module.css";
import { usePocketBase } from "@/hooks/usePocketBase";

const links = [
  { link: URLS.HOME, label: "Home", icon: IconHome },
  { link: URLS.TAGS, label: "Tags", icon: IconTags },
  { link: URLS.FEEDS, label: "Feeds", icon: IconRss },
  { link: URLS.SETTINGS, label: "Settings", icon: IconSettings },
];

interface LynxShellProps {
  children: ReactNode;
}

const TopMenu = ({
  burger,
  title,
}: {
  burger?: React.ReactElement;
  title?: string;
}) => {
  return (
    <AppShell.Header>
      <div className={classes.inner}>
        <Group h="100%" px="md">
          {burger ? burger : null}
          <Link to={URLS.HOME}>
            <LynxLogo />
          </Link>
          {title ? (
            <Text fw={500} truncate="end" size="lg">
              {title}
            </Text>
          ) : null}
        </Group>
        <Group h="100%" px="md">
          <Autocomplete
            placeholder="Search Lynx"
            leftSection={
              <IconSearch
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
              />
            }
            rightSection={<Kbd>⌘K</Kbd>}
            data={[]}
          />
        </Group>
      </div>
    </AppShell.Header>
  );
};

export const FullBleedLynxShell = ({
  children,
  title,
}: LynxShellProps & { title?: string }) => {
  const pinned = useHeadroom({ fixedAt: 120 });
  return (
    <AppShell header={{ height: 60, collapsed: !pinned, offset: false }}>
      <TopMenu title={title} />
      <AppShell.Main pt={`calc(${rem(60)}`}>{children}</AppShell.Main>
    </AppShell>
  );
};

const LynxShell = ({ children }: LynxShellProps) => {
  const { user, logout } = usePocketBase();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <TopMenu
        burger={
          <>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
            />
          </>
        }
      />
      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          {links.map((item) => (
            <NavLink
              key={item.label}
              component={Link}
              to={item.link}
              label={item.label}
              leftSection={<item.icon size={24} stroke={1} />}
              active={location.pathname === item.link}
            />
          ))}
        </AppShell.Section>
        <AppShell.Section>
          <NavLink
            component={Link}
            to={URLS.SETTINGS}
            label={user?.username}
            leftSection={
              <Avatar m={0} size={24} name={user?.name} color="initials" src={user?.avatar} />
            }
          />
          <NavLink 
            onClick={logout}
            label="Logout"
            leftSection={<IconLogout size={24} stroke={1} />}
            />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
export default LynxShell;
