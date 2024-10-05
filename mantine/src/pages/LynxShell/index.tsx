import { ReactNode } from "react";
import {
  Autocomplete,
  AppShell,
  Burger,
  Group,
  NavLink,
  rem,
  Kbd,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useLocation } from "react-router-dom";
import {
  IconHome,
  IconTags,
  IconRss,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import LynxLogo from "@/components/LynxLogo";
import URLS from "@/lib/urls";
import classes from "./LynxShell.module.css";

const links = [
  { link: URLS.HOME, label: "Home", icon: IconHome },
  { link: URLS.TAGS, label: "Tags", icon: IconTags },
  { link: URLS.FEEDS, label: "Feeds", icon: IconRss },
  { link: URLS.SETTINGS, label: "Settings", icon: IconSettings },
];

interface LynxShellProps {
  children: ReactNode;
}

const LynxShell = ({ children }: LynxShellProps) => {
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
      <AppShell.Header>
        <div className={classes.inner}>
          <Group h="100%" px="md">
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
            <Link to={URLS.HOME}>
              <LynxLogo />
            </Link>
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
      <AppShell.Navbar p="md">
        {links.map((item) => (
          <NavLink
            key={item.label}
            component={Link}
            to={item.link}
            label={item.label}
            leftSection={<item.icon size="1rem" stroke={1.5} />}
            active={location.pathname === item.link}
          />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
export default LynxShell;
