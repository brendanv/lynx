import type { Page } from "@playwright/test";
import {
  test,
  anonymousTest,
  expect,
  capture,
  expectNoPageErrors,
  applyColorScheme,
  schemeForProject,
} from "../lib/test";
import { readArticleLink, userFeeds, userTags } from "../lib/manifest";

/**
 * Renders every route against the seeded database, screenshots it, and fails if
 * the page logged an error or never showed its content.
 *
 * Screenshots land in testing/screenshots/<project>/<name>.png and are attached
 * to the HTML report (`npm run report`).
 */

type PageCase = {
  name: string;
  path: string;
  /** Document title the route sets, minus the " | Lynx" suffix. */
  title?: string;
  /** Waits for the content that proves the route actually rendered. */
  ready: (page: Page) => Promise<void>;
};

const articleLink = () => readArticleLink();
const archivedLink = () => readArticleLink((l) => l.hasArchive);

function cases(): PageCase[] {
  const tag = userTags()[0];
  const feed = userFeeds()[0];
  const article = articleLink();
  const archived = archivedLink();

  return [
    {
      name: "home-feed",
      path: "/",
      title: "My Feed",
      ready: async (page) => {
        await expect(page.getByText(article.title)).toBeVisible();
        await expect(page.getByRole("navigation")).toBeVisible();
      },
    },
    {
      name: "home-unread",
      path: "/?r=unread",
      title: "My Feed",
      ready: async (page) =>
        expect(await linkCardCount(page)).toBeGreaterThan(0),
    },
    {
      name: "home-starred",
      path: "/?st=is_starred",
      title: "My Feed",
      ready: async (page) =>
        expect(await linkCardCount(page)).toBeGreaterThan(0),
    },
    {
      name: "home-search",
      path: "/?s=caching",
      title: "My Feed",
      ready: async (page) =>
        expect(await linkCardCount(page)).toBeGreaterThan(0),
    },
    {
      name: "home-filtered-by-tag",
      path: `/?t=${tag.id}`,
      title: "My Feed",
      ready: async (page) =>
        expect(await linkCardCount(page)).toBeGreaterThan(0),
    },
    {
      name: "home-filtered-by-feed",
      path: `/?f=${feed.id}`,
      title: "My Feed",
      ready: async (page) =>
        expect(await linkCardCount(page)).toBeGreaterThan(0),
    },
    {
      name: "home-page-two",
      path: "/?p=2",
      title: "My Feed",
      ready: async (page) =>
        expect(await linkCardCount(page)).toBeGreaterThan(0),
    },
    {
      name: "link-viewer",
      path: `/link/${article.id}/view`,
      ready: async (page) => {
        await expect(page.locator('[class*="articleContent"]')).toBeVisible();
        await expect(
          page.locator('[class*="articleContent"] p').first(),
        ).toBeVisible();
      },
    },
    {
      name: "link-edit",
      path: `/link/${article.id}/edit`,
      title: "Edit Link",
      ready: async (page) => {
        await expect(
          page.getByRole("heading", { name: "Edit Link" }),
        ).toBeVisible();
        await expect(page.getByLabel("Title")).not.toHaveValue("");
      },
    },
    {
      name: "link-archive",
      path: `/link/${archived.id}/archive`,
      title: "Link Archive",
      ready: async (page) => {
        await expect(page.locator(".archive-content")).toBeVisible();
        await expect(page.getByText("Seeded offline archive")).toBeVisible();
      },
    },
    {
      name: "add-link",
      path: "/links/add",
      title: "Add Link",
      ready: async (page) =>
        expect(
          page.getByRole("heading", { name: "Save a New Link" }),
        ).toBeVisible(),
    },
    {
      name: "highlights",
      path: "/highlights",
      title: "My Highlights",
      ready: async (page) =>
        expect(page.locator("blockquote").first()).toBeVisible(),
    },
    {
      name: "feed-items",
      path: `/feed/${feed.id}/items`,
      title: feed.name,
      ready: async (page) =>
        expect(
          page.getByRole("heading", { name: `Feed: ${feed.name}` }),
        ).toBeVisible(),
    },
    {
      name: "settings-general",
      path: "/settings/general",
      title: "Settings",
      ready: async (page) =>
        expect(page.getByRole("tab", { name: "Settings" })).toBeVisible(),
    },
    {
      name: "settings-tags",
      path: "/settings/tags",
      title: "Tags",
      ready: async (page) =>
        expect(page.getByText(userTags()[0].name)).toBeVisible(),
    },
    {
      name: "settings-feeds",
      path: "/settings/feeds",
      title: "Feeds",
      ready: async (page) =>
        expect(page.getByText(feed.name).first()).toBeVisible(),
    },
    {
      name: "settings-cookies",
      path: "/settings/cookies",
      title: "Cookies",
      ready: async (page) =>
        expect(page.getByText("paywall_session")).toBeVisible(),
    },
    {
      name: "settings-api-keys",
      path: "/settings/api_keys",
      title: "API Keys",
      ready: async (page) =>
        expect(page.getByText("iOS shortcut")).toBeVisible(),
    },
    {
      name: "settings-import",
      path: "/settings/import",
      title: "Import",
      ready: async (page) =>
        expect(page.getByRole("tab", { name: "Import" })).toBeVisible(),
    },
  ];
}

/**
 * Counts the link cards on screen. Each card links to its own viewer route
 * twice (title and excerpt), so the distinct hrefs are the card count.
 */
async function linkCardCount(page: Page): Promise<number> {
  const cardLinks = page.locator('a[href^="/link/"][href$="/view"]');
  await expect(cardLinks.first()).toBeVisible();
  return cardLinks.evaluateAll(
    (elements) => new Set(elements.map((el) => el.getAttribute("href"))).size,
  );
}

test.describe("signed in pages", () => {
  for (const pageCase of cases()) {
    test(pageCase.name, async ({ page, pageErrors }) => {
      await page.goto(pageCase.path);
      await pageCase.ready(page);

      if (pageCase.title) {
        await expect(page).toHaveTitle(`${pageCase.title} | Lynx`);
      }

      await capture(page, pageCase.name);
      expectNoPageErrors(pageErrors);
    });
  }
});

anonymousTest.describe("signed out pages", () => {
  anonymousTest.beforeEach(async ({ page }, testInfo) => {
    await applyColorScheme(page, schemeForProject(testInfo.project.name));
  });

  anonymousTest("login", async ({ page, pageErrors }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back to Lynx!" }),
    ).toBeVisible();
    await expect(page).toHaveTitle("Login | Lynx");

    await capture(page, "login");
    expectNoPageErrors(pageErrors);
  });

  anonymousTest("redirects to login when signed out", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back to Lynx!" }),
    ).toBeVisible();
  });
});
