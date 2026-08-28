import { defineConfig, devices } from "@playwright/test";

/** No image artifacts. Set VR_BASE_URL to also check representative real stories. */
export default defineConfig({
  testDir: "./tests",
  testMatch: process.env.VR_BASE_URL
    ? ["fixture-contract.spec.ts", "fixture-presence.spec.ts"]
    : "fixture-contract.spec.ts",
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 15_000,
  outputDir: "./test-results/fixture-guards",
  reporter: [["list"]],
  use: { baseURL: process.env.VR_BASE_URL, screenshot: "off", trace: "off" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } }
  ]
});
