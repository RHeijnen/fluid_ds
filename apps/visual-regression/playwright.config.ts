import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const STORYBOOK_STATIC = resolve(HERE, "../storybook/storybook-static");

const PORT = Number(process.env.VR_PORT ?? 6007);
const BASE_URL = process.env.VR_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * Playwright config for Fluid visual regression.
 *
 * Strategy
 * - Storybook is built once into `apps/storybook/storybook-static` (a fully
 *   static site). We serve it on a local port and navigate Playwright to
 *   `iframe.html?id=<story-id>&viewMode=story` URLs for each story.
 * - We commit the baseline PNGs into `__screenshots__/` next to the tests
 *   so they travel with the repo and are reviewable in PRs.
 * - This project is **opt-in**. It is not wired into `pnpm verify` so quick
 *   local verify stays fast, CI runs it as a separate job.
 *
 * Quirks handled here
 * - `animations: "disabled"` on every screenshot to eliminate motion noise.
 * - A small `maxDiffPixelRatio` allows sub-pixel renderer noise across
 *   machines while still catching real visual regressions.
 * - Only Chromium is used by default: adding WebKit/Firefox roughly
 *   triples the baseline count for little extra signal on a component
 *   library that targets Chromium-class engines anyway.
 */
export default defineConfig({
  testDir: "./tests",
  snapshotDir: "./__screenshots__",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      // Allow ~1% sub-pixel renderer drift; catches real visual diffs.
      maxDiffPixelRatio: 0.01,
      // Be strict per-pixel so true regressions still show up.
      threshold: 0.2
    }
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 1
      }
    }
  ],
  webServer: process.env.VR_BASE_URL
    ? undefined
    : {
        // Serve the prebuilt Storybook on a dedicated port. `--silent` keeps
        // the runner output focused on test results.
        command: `pnpm exec http-server "${STORYBOOK_STATIC}" -p ${PORT} -s -c-1`,
        url: `${BASE_URL}/iframe.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
      }
});
