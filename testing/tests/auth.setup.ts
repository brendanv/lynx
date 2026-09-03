import fs from "node:fs";
import path from "node:path";
import { test as setup, expect } from "@playwright/test";
import { AUTH_STATE_PATH, BACKEND_URL } from "../lib/env";
import { primaryUser, readArticleLink } from "../lib/manifest";

/**
 * The setup project logs the demo user in once and stores the session for
 * every other project.
 */
setup("authenticate as the demo user", async ({ page }) => {
  const user = primaryUser();

  await page.goto("/login");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await page.waitForURL("**/");
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();

  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
  await page.context().storageState({ path: AUTH_STATE_PATH });
});

/**
 * Highlights cannot be seeded from Go: a highlight stores a serialized DOM
 * range that only means something against the rendered page. So they are
 * created the way a user creates them — by selecting text in the article and
 * saving it — which also keeps the highlight flow itself under test.
 */
setup("create highlights", async ({ page, request }) => {
  setup.setTimeout(120_000);

  const user = primaryUser();

  // Reset first so re-running the suite does not pile up highlights.
  const auth = await request.post(
    `${BACKEND_URL}/api/collections/users/auth-with-password`,
    { data: { identity: user.username, password: user.password } },
  );
  expect(auth.ok(), "failed to authenticate against the backend").toBeTruthy();
  const { token } = (await auth.json()) as { token: string };

  const existing = await request.get(
    `${BACKEND_URL}/api/collections/highlights/records`,
    {
      headers: { Authorization: token },
      params: { perPage: "200" },
    },
  );
  const { items } = (await existing.json()) as { items: { id: string }[] };
  for (const item of items) {
    await request.delete(
      `${BACKEND_URL}/api/collections/highlights/records/${item.id}`,
      {
        headers: { Authorization: token },
      },
    );
  }

  await page.goto("/login");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/");

  const articleLink = readArticleLink();
  const secondArticle = readArticleLink((l) => l.id !== articleLink.id);

  await highlightParagraph(page, articleLink.id, 0);
  await highlightParagraph(page, articleLink.id, 2);
  await highlightParagraph(page, secondArticle.id, 1);
});

/**
 * Selects the text of one paragraph of the rendered article and saves it as a
 * highlight.
 */
async function highlightParagraph(
  page: import("@playwright/test").Page,
  linkId: string,
  paragraphIndex: number,
) {
  await page.goto(`/link/${linkId}/view`);

  const article = page.locator('[class*="articleContent"]');
  await expect(article).toBeVisible();
  await expect(article.locator("p").nth(paragraphIndex)).toBeVisible();

  await page.evaluate((index) => {
    const container = document.querySelector('[class*="articleContent"]');
    if (!container) throw new Error("article container not found");

    const paragraph = container.querySelectorAll("p")[index];
    if (!paragraph) throw new Error(`no paragraph at index ${index}`);

    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    const textNode = walker.nextNode();
    if (!textNode || !textNode.textContent)
      throw new Error("paragraph has no text");

    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, Math.min(180, textNode.textContent.length));

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    // The viewer listens for mouseup on the article to pick up the selection.
    container.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }, paragraphIndex);

  const saveButton = page.getByRole("button", { name: "Save Highlight" });
  await expect(saveButton).toBeVisible();

  const created = page.waitForResponse(
    (response) =>
      response.url().includes("/api/collections/highlights/records") &&
      response.request().method() === "POST",
  );
  await saveButton.click();
  const response = await created;
  expect(response.status(), "creating a highlight failed").toBe(200);
}
