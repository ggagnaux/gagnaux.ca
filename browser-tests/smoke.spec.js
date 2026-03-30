const { test, expect } = require("@playwright/test");

const publishedPostSlug = "building-at-the-intersection-of-code-art-and-sound";

test("homepage smoke test renders the hero and featured content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("I build software");
  await expect(page.getByRole("link", { name: "View Projects" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Featured Projects" })).toBeVisible();
});

test("admin smoke test signs in and reaches the dashboard", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Username").fill("testadmin");
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("blog detail smoke test renders a published post", async ({ page }) => {
  await page.goto(`/blog/${publishedPostSlug}`);

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Building at the intersection of code, art, and sound");
  await expect(page.locator("article[data-prose]")).toContainText("This site is a place to collect projects, notes, and experiments");
});
