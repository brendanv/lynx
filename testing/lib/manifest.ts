import fs from "node:fs";
import { MANIFEST_PATH } from "./env";

export type ManifestUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  primary: boolean;
};

export type ManifestNamed = { id: string; name: string; user: string };

export type ManifestLink = {
  id: string;
  title: string;
  user: string;
  read: boolean;
  starred: boolean;
  hasArchive: boolean;
  hasArticle: boolean;
};

export type ManifestKey = {
  id: string;
  name: string;
  key: string;
  user: string;
  expired: boolean;
};

export type Manifest = {
  baseUrl: string;
  admin: { email: string; password: string };
  users: ManifestUser[];
  tags: ManifestNamed[];
  feeds: ManifestNamed[];
  links: ManifestLink[];
  apiKeys: ManifestKey[];
  createdAt: string;
};

let cached: Manifest | undefined;

/**
 * Reads the manifest written by `backend/cmd/seed`. Tests use it instead of
 * hardcoding record IDs, so changing the fixtures does not break the specs.
 */
export function manifest(): Manifest {
  if (cached) return cached;

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Seed manifest not found at ${MANIFEST_PATH}.\n` +
        `Seed the test database first:\n\n` +
        `  cd backend && go run ./cmd/seed --reset --dir ./pb_test_data\n\n` +
        `or run testing/run.sh, which does it for you.`,
    );
  }

  cached = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  return cached;
}

export function primaryUser(): ManifestUser {
  const user = manifest().users.find((u) => u.primary);
  if (!user) throw new Error("Seed manifest has no primary user");
  return user;
}

export function userLinks(): ManifestLink[] {
  const user = primaryUser();
  return manifest().links.filter((l) => l.user === user.id);
}

/** The first seeded link matching a predicate, with a useful error if absent. */
export function findLink(
  description: string,
  predicate: (link: ManifestLink) => boolean,
): ManifestLink {
  const link = userLinks().find(predicate);
  if (!link) throw new Error(`Seed data has no link that is ${description}`);
  return link;
}

/**
 * A link that already counts as read. Opening the link viewer stamps
 * last_viewed_at, so tests that navigate into an article use one that is
 * already read — otherwise running the suite changes the unread counts the
 * other tests assert on.
 */
export function readArticleLink(
  extra: (link: ManifestLink) => boolean = () => true,
): ManifestLink {
  return findLink(
    "read, has an article body",
    (l) => l.hasArticle && l.read && extra(l),
  );
}

export function userTags(): ManifestNamed[] {
  const user = primaryUser();
  return manifest().tags.filter((t) => t.user === user.id);
}

export function userFeeds(): ManifestNamed[] {
  const user = primaryUser();
  return manifest().feeds.filter((f) => f.user === user.id);
}
