import { render as testingLibraryRender } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { PocketBaseProvider } from "@/hooks/usePocketBase";

export function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider>
        <PocketBaseProvider>{children}</PocketBaseProvider>
      </MantineProvider>
    ),
  });
}

export const renderRaw = testingLibraryRender;
