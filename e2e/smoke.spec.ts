import { test, expect } from "@playwright/test";

test("guest can sign in and load feed", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: /Continue/i }).click();
  await expect(page.getByRole("heading", { name: /personalized world brief/i })).toBeVisible();
});

test("refresh button reloads feed", async ({ page }) => {
  await page.goto("/api/auth/login");
  await page.goto("/");
  await page.getByRole("button", { name: /Refresh/i }).click();
  await expect(page.getByRole("button", { name: /Refresh/i })).toBeVisible();
});

test("article page shows more like this", async ({ page }) => {
  await page.goto("/api/auth/login");
  await page.goto("/");
  const firstArticle = page.locator("article").first();
  await firstArticle.getByRole("link").first().click();
  await expect(page.getByRole("heading", { name: /More like this/i })).toBeVisible();
});
