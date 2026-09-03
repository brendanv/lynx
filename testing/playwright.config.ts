import { defineConfig, devices } from "@playwright/test";
import {
  BACKEND_PORT,
  BACKEND_URL,
  FRONTEND_PORT,
  FRONTEND_URL,
  SEED_DATA_DIR,
} from "./lib/env";

/**
 * Playwright starts the backend and the frontend itself, so `npm test` is the
 * only command needed once the database has been seeded:
 *
 *   cd backend && go run ./cmd/seed --reset
 *   cd testing && npm test
 *
 * `./run.sh` does both in one step.
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    video: "off",
    // Screenshots are written explicitly by the specs; this only covers
    // unexpected failures.
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "desktop-light",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        colorScheme: "light",
      },
    },
    {
      name: "desktop-dark",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        colorScheme: "dark",
      },
    },
    {
      name: "mobile-light",
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], colorScheme: "light" },
    },
  ],

  webServer: [
    {
      command: `go run main.go serve --http=127.0.0.1:${BACKEND_PORT} --dir=${SEED_DATA_DIR}`,
      cwd: "../backend",
      url: `${BACKEND_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `npx vite --port ${FRONTEND_PORT} --strictPort`,
      cwd: "../frontend",
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { VITE_POCKETBASE_URL: BACKEND_URL },
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
