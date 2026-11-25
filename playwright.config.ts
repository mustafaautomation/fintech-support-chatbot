import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:38473",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm exec next start -p 38473 --hostname 127.0.0.1",
    url: "http://127.0.0.1:38473/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile.spec.ts/ },
    { name: "mobile", use: { ...devices["Pixel 5"] }, testMatch: /mobile.spec.ts/ },
  ],
});
