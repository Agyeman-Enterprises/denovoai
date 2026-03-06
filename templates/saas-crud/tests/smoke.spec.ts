import { test, expect } from "@playwright/test";

test("homepage renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("DeNovo");
  await expect(page.locator("body")).toContainText("Modules");
});
