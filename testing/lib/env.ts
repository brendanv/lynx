import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(here, "..", "..");
export const TESTING_ROOT = path.resolve(here, "..");

export const BACKEND_PORT = Number(process.env.LYNX_BACKEND_PORT ?? 8090);
export const FRONTEND_PORT = Number(process.env.LYNX_FRONTEND_PORT ?? 5273);

export const BACKEND_URL =
  process.env.LYNX_BACKEND_URL ?? `http://127.0.0.1:${BACKEND_PORT}`;
export const FRONTEND_URL =
  process.env.LYNX_FRONTEND_URL ?? `http://127.0.0.1:${FRONTEND_PORT}`;

/**
 * Data directory the tests run against. It is deliberately separate from the
 * default `backend/pb_data` so running the suite never touches a development
 * database.
 */
export const SEED_DATA_DIR = process.env.LYNX_SEED_DATA_DIR ?? "./pb_test_data";

/** Absolute path to the same directory, for reading the manifest. */
export const SEED_DATA_DIR_ABS = path.isAbsolute(SEED_DATA_DIR)
  ? SEED_DATA_DIR
  : path.resolve(REPO_ROOT, "backend", SEED_DATA_DIR);

export const MANIFEST_PATH =
  process.env.LYNX_SEED_MANIFEST ??
  path.join(SEED_DATA_DIR_ABS, "seed-manifest.json");

export const SCREENSHOT_DIR =
  process.env.LYNX_SCREENSHOT_DIR ?? path.join(TESTING_ROOT, "screenshots");

export const AUTH_STATE_PATH = path.join(TESTING_ROOT, ".auth", "demo.json");
