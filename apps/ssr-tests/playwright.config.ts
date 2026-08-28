import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.SSR_TEST_PORT ?? 4178);
const baseURL = process.env.SSR_TEST_BASE_URL ?? `http://127.0.0.1:${port}`;
const supported = ["chromium", "firefox", "webkit"] as const;
const selection = process.env.FLUID_BROWSERS ?? "chromium";
const requested = selection === "all" ? [...supported] : selection.split(",").map((name) => name.trim());
if (requested.some((name) => !supported.includes(name as typeof supported[number]))) {
  throw new Error(`Unsupported FLUID_BROWSERS: ${selection}`);
}
const profiles = { chromium: "Desktop Chrome", firefox: "Desktop Firefox", webkit: "Desktop Safari" } as const;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 60_000,
  // The strict three-engine matrix is intentionally serial and currently has
  // 231 cases. Keep per-test and server startup at 60s while allowing the
  // complete healthy matrix to finish with bounded teardown headroom.
  globalTimeout: 600_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: supported.filter((name) => requested.includes(name)).map((name) => ({
    name, use: { ...devices[profiles[name]] }
  })),
  webServer: process.env.SSR_TEST_BASE_URL
    ? undefined
    : {
        command: `corepack pnpm exec vite --host 127.0.0.1 --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
      }
});
