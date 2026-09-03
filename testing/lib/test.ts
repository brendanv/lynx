import fs from "node:fs";
import path from "node:path";
import {
  test as base,
  expect,
  type BrowserContext,
  type ConsoleMessage,
  type Page,
} from "@playwright/test";
import { AUTH_STATE_PATH, SCREENSHOT_DIR } from "./env";

/**
 * Console noise that is not a rendering problem. Anything else that reaches
 * console.error or an uncaught exception fails the test — that is the check
 * that makes the screenshots meaningful rather than decorative.
 */
const IGNORED_CONSOLE_PATTERNS = [
  /favicon\.ico/i,
  /Download the React DevTools/i,
  /React Router Future Flag Warning/i,
  // Mantine sizes some icons with a rem calc() that the SVG width/height
  // attributes reject. The browser falls back to the CSS size, so it is noise
  // rather than a rendering failure.
  /<svg> attribute (width|height): Expected length/i,
];

type TestFixtures = {
  /** Console errors and uncaught exceptions seen so far in this test. */
  pageErrors: string[];
};

type WorkerFixtures = {
  /** One signed-in browser context per worker — see the note on `test`. */
  authedContext: BrowserContext;
  /** The page every signed-in test in the worker shares. */
  authedPage: Page;
};

const collectErrors = async (
  page: Page,
  use: (errors: string[]) => Promise<void>,
) => {
  const errors: string[] = [];

  const onConsole = (message: ConsoleMessage) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) return;
    errors.push(`console.error: ${text}`);
  };
  const onPageError = (error: Error) => {
    errors.push(`uncaught: ${error.message}`);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await use(errors);

  // The page outlives the test, so the listeners have to go with it.
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
};

/**
 * Tests that run as the seeded demo user.
 *
 * One signed-in page is shared by every test in the worker, on purpose. Vite
 * serves the frontend as several hundred unbundled modules with `no-cache`, so
 * a fresh page revalidates all of them and takes about ten seconds to load,
 * while navigating an existing page reuses the renderer's memory cache and
 * takes about one. Every test starts with its own `page.goto`, so the shared
 * page carries no state between them beyond the browser session.
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  authedContext: [
    async ({ browser }, use, workerInfo) => {
      if (!fs.existsSync(AUTH_STATE_PATH)) {
        throw new Error(
          `No saved session at ${AUTH_STATE_PATH}. The "setup" project creates it; ` +
            `run the suite without --project, or run --project=setup first.`,
        );
      }
      const context = await browser.newContext({
        storageState: AUTH_STATE_PATH,
      });
      await applyColorScheme(
        context,
        schemeForProject(workerInfo.project.name),
      );
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],

  authedPage: [
    async ({ authedContext }, use) => {
      const page = await authedContext.newPage();
      await use(page);
      await page.close();
    },
    { scope: "worker" },
  ],

  page: async ({ authedPage }, use) => {
    await use(authedPage);
  },

  pageErrors: async ({ page }, use) => collectErrors(page, use),
});

/** Tests that run signed out, in their own throwaway context. */
export const anonymousTest = base.extend<TestFixtures>({
  pageErrors: async ({ page }, use) => collectErrors(page, use),
});

export { expect };

/**
 * Saves a full page screenshot under testing/screenshots/<project>/ and
 * attaches it to the HTML report.
 */
export async function capture(page: Page, name: string): Promise<string> {
  const info = test.info();
  const dir = path.join(SCREENSHOT_DIR, info.project.name);
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${name}.png`);
  // The React Query devtools button only exists in dev builds and would sit in
  // the corner of every screenshot.
  await page.addStyleTag({
    content:
      '.tsqd-parent-container, [aria-label="Open Tanstack query devtools"] { display: none !important; }',
  });
  // Let fonts settle and any entrance transition finish before capturing.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: file, fullPage: true, animations: "disabled" });

  await info.attach(`${info.project.name}/${name}`, {
    path: file,
    contentType: "image/png",
  });
  return file;
}

/** Fails the test if anything was logged to console.error or thrown. */
export function expectNoPageErrors(pageErrors: string[]) {
  expect(pageErrors, `page reported errors:\n${pageErrors.join("\n")}`).toEqual(
    [],
  );
}

export type ColorScheme = "light" | "dark";

/** Projects named `*-dark` render in dark mode. */
export function schemeForProject(projectName: string): ColorScheme {
  return projectName.includes("dark") ? "dark" : "light";
}

/**
 * Forces Mantine's colour scheme before the app boots, so dark mode
 * screenshots do not depend on the toggle being clicked.
 */
export async function applyColorScheme(
  target: BrowserContext | Page,
  scheme: ColorScheme,
) {
  await target.addInitScript((value) => {
    window.localStorage.setItem("mantine-color-scheme-value", value);
  }, scheme);
}
