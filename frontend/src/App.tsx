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
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient();

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
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <Notifications />
          <PocketBaseProvider>
            <Router />
          </PocketBaseProvider>
        </QueryClientProvider>
      </MantineProvider>
    </Suspense>
  );
}
