import "@mantine/core/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/notifications/styles.css";
import '@mantine/nprogress/styles.css';

import { MantineProvider } from "@mantine/core";
import Router from "@/Router";
import { theme } from "@/theme";
import { Suspense } from "react";
import { PocketBaseProvider } from "@/hooks/usePocketBase";
import { Notifications } from '@mantine/notifications';

export default function App() {
  return (
    <Suspense>
      <MantineProvider theme={theme}>
        <Notifications />
        <PocketBaseProvider>
          <Router />
        </PocketBaseProvider>
      </MantineProvider>
    </Suspense>
  );
}
