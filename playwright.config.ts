import { defineConfig, devices } from "@playwright/test";

// Production Safety Check: Fail-fast if pointing to production Supabase
const prodUrl = process.env.PRODUCTION_SUPABASE_URL;
const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (prodUrl && currentUrl && prodUrl.trim() === currentUrl.trim()) {
  throw new Error(
    "[SAFETY ABORT] Playwright E2E tests refused to run: NEXT_PUBLIC_SUPABASE_URL matches PRODUCTION_SUPABASE_URL. E2E tests must only target a local or staging test database."
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Serial execution to preserve competition state machine
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
