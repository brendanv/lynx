import "@mantine/core/styles.css";
import '@mantine/spotlight/styles.css';

import { MantineProvider } from "@mantine/core";
import Router from "@/Router";
import { theme } from "@/theme";
import { Suspense } from "react";
import { PocketBaseProvider } from "@/hooks/usePocketBase";

export default function App() {
  return (
    <Suspense>
      <MantineProvider theme={theme}>
        <PocketBaseProvider>
          <Router />
        </PocketBaseProvider>
      </MantineProvider>
    </Suspense>
  );
}
