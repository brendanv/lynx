import "@mantine/core/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";

import { CSSVariablesResolver, MantineProvider } from "@mantine/core";
import Router from "@/Router";
import { theme } from "@/theme";
import { Suspense } from "react";
import { PocketBaseProvider } from "@/hooks/usePocketBase";
import { Notifications } from "@mantine/notifications";

const resolver: CSSVariablesResolver = () => ({
  variables: {
    "--indicator-z-index": "25",
  },
  dark: {},
  light: {},
});

export default function App() {
  return (
    <Suspense>
      <MantineProvider theme={theme} cssVariablesResolver={resolver}>
        <Notifications />
        <PocketBaseProvider>
          <Router />
        </PocketBaseProvider>
      </MantineProvider>
    </Suspense>
  );
}
