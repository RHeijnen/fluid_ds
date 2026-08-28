import { defineConfig, devices } from "@playwright/test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const storybookStatic = resolve(here, "../storybook/storybook-static");
const httpServer = resolve(here, "node_modules/http-server/bin/http-server");
const port = Number(process.env.A11Y_PORT ?? 6008);
const baseURL = process.env.A11Y_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    ["chromium", "Desktop Chrome"],
    ["firefox", "Desktop Firefox"],
    ["webkit", "Desktop Safari"]
  ].map(([name, device]) => ({
    name,
    use: { ...devices[device!], viewport: { width: 1280, height: 900 } }
  })),
  webServer: process.env.A11Y_BASE_URL
    ? undefined
    : {
        command: `"${process.execPath}" "${httpServer}" "${storybookStatic}" -p ${port} -a 127.0.0.1 -s -c-1`,
        url: `${baseURL}/iframe.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
      }
});
