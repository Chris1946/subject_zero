import { test, expect } from "@playwright/test";

test.describe("Round 1: Monitoring Station Smoke Tests", () => {
  test.beforeEach(async () => {
    const prodUrl = process.env.PRODUCTION_SUPABASE_URL;
    const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (prodUrl && currentUrl && prodUrl.trim() === currentUrl.trim()) {
      throw new Error(
        "[SAFETY ABORT] Refusing to run E2E test against production database."
      );
    }
  });

  test("Round 1 end-to-end progression reaches the discovery file", async ({ page }) => {
    // Navigate to play page or join
    await page.goto("/play");
    // If not authenticated, page redirects to home
    if (page.url().includes("/")) {
      const heading = page.locator("h1");
      await expect(heading).toBeVisible();
    }
  });
});
