import type { Page } from "@playwright/test";
import { test, expect } from "../lib/test";
import { manifest, primaryUser, userLinks } from "../lib/manifest";

/**
 * Checks that the seeded data reaches the UI the way the fixtures describe it.
 * These are the assertions that catch a broken query or collection rule, as
 * opposed to a broken layout — the screenshots cover the latter.
 */

const PAGE_SIZE = 18;

test.describe("seeded library", () => {
  test("paginates the full library", async ({ page }) => {
    const total = userLinks().length;
    expect(total, "seed data should span more than one page").toBeGreaterThan(
      PAGE_SIZE,
    );

    await page.goto("/");
    expect(await cardTitles(page)).toHaveLength(PAGE_SIZE);

    await page.goto("/?p=2");
    expect(await cardTitles(page)).toHaveLength(total - PAGE_SIZE);
  });

  test("only shows the signed in user's links", async ({ page }) => {
    const otherUsersLinks = manifest().links.filter(
      (l) => l.user !== primaryUser().id,
    );
    expect(
      otherUsersLinks.length,
      "seed data should include a second user",
    ).toBeGreaterThan(0);

    const seen = new Set<string>();
    for (const path of ["/", "/?p=2"]) {
      await page.goto(path);
      for (const title of await cardTitles(page)) seen.add(title);
    }

    for (const link of otherUsersLinks) {
      expect(
        seen.has(link.title),
        `${link.title} leaked into the demo user's feed`,
      ).toBe(false);
    }
  });

  test("filters unread links", async ({ page }) => {
    const expected = userLinks().filter((l) => !l.read);
    expect(expected.length).toBeGreaterThan(0);

    await page.goto("/?r=unread");
    const titles = await cardTitles(page);
    expect(titles).toHaveLength(Math.min(expected.length, PAGE_SIZE));
    for (const title of titles) {
      expect(
        expected.some((l) => l.title === title),
        `${title} is not unread`,
      ).toBe(true);
    }
  });

  test("filters starred links", async ({ page }) => {
    const expected = userLinks().filter((l) => l.starred);
    expect(expected.length).toBeGreaterThan(0);

    await page.goto("/?st=is_starred");
    const titles = await cardTitles(page);
    expect(titles.sort()).toEqual(expected.map((l) => l.title).sort());
  });

  test("search matches article titles", async ({ page }) => {
    const target = userLinks().find((l) =>
      l.title.toLowerCase().includes("caching"),
    );
    expect(
      target,
      "seed data should contain a link about caching",
    ).toBeTruthy();

    await page.goto("/?s=caching");
    expect(await cardTitles(page)).toContain(target!.title);
  });

  test("renders a stored article and its archive", async ({ page }) => {
    const link = userLinks().find(
      (l) => l.hasArticle && l.hasArchive && l.read,
    );
    expect(link, "seed data should contain an archived article").toBeTruthy();

    await page.goto(`/link/${link!.id}/view`);
    const article = page.locator('[class*="articleContent"]');
    await expect(article).toBeVisible();
    expect(await article.locator("p").count()).toBeGreaterThan(3);

    await page.goto(`/link/${link!.id}/archive`);
    await expect(page.getByText("Seeded offline archive")).toBeVisible();
  });

  test("highlights created by the setup step are listed", async ({ page }) => {
    await page.goto("/highlights");
    await expect(page.locator("blockquote").first()).toBeVisible();
    expect(await page.locator("blockquote").count()).toBeGreaterThanOrEqual(3);
  });
});

/** Titles of the link cards currently rendered, in display order. */
async function cardTitles(page: Page): Promise<string[]> {
  await expect(
    page.locator('a[href^="/link/"][href$="/view"]').first(),
  ).toBeVisible();

  return page.evaluate(() => {
    const anchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        'a[href^="/link/"][href$="/view"]',
      ),
    );
    const byHref = new Map<string, string>();
    for (const anchor of anchors) {
      const href = anchor.getAttribute("href")!;
      // The first anchor for a card is its title, the second its excerpt.
      if (!byHref.has(href)) byHref.set(href, anchor.textContent?.trim() ?? "");
    }
    return Array.from(byHref.values());
  });
}
