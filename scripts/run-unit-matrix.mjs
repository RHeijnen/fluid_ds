import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePinnedPnpm } from "./pnpm-runtime.mjs";
import { resolveTestBrowsers } from "./resolve-test-browsers.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export function unitMatrixCommands(catalog, browsers) {
  const packages = [...new Set(catalog.components.map((component) => component.package))].sort();
  if (!packages.length || packages.some((name) => !/^@fluid-ds\/[a-z][a-z0-9-]*$/.test(name))) {
    throw new Error("Unit matrix requires valid catalog package names");
  }
  if (
    !browsers.length ||
    new Set(browsers).size !== browsers.length ||
    browsers.some((name) => !["chromium", "firefox", "webkit"].includes(name))
  ) {
    throw new Error("Unit matrix requires distinct supported browsers");
  }
  return browsers.map((browser) => ({
    browser,
    packages,
    args: [
      "pnpm",
      "--workspace-concurrency=1",
      "--no-bail",
      ...packages.flatMap((name) => ["--filter", name]),
      "test"
    ]
  }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 2)
    throw new Error("Select engines through FLUID_BROWSERS, not extra arguments");
  const catalog = JSON.parse(
    await readFile(new URL("../quality/component-quality.json", import.meta.url), "utf8")
  );
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const pnpm = resolvePinnedPnpm(manifest.packageManager);
  const matrix = unitMatrixCommands(catalog, resolveTestBrowsers());
  const outcomes = [];
  // Fresh processes for each engine and serial packages avoid shared browser
  // teardown contention. This runs every selected engine once, not as retries.
  // Recursive no-bail drains the package queue before reporting failures; the
  // default bail can reject while a newly started queued task is still running.
  for (const entry of matrix) {
    console.log(
      `Unit matrix: ${entry.browser}, ${entry.packages.length} packages, serial execution`
    );
    const result = spawnSync(pnpm, entry.args.slice(1), {
      cwd: root,
      shell: process.platform === "win32",
      windowsHide: true,
      stdio: "inherit",
      env: {
        ...process.env,
        CI: "true",
        FLUID_BROWSERS: entry.browser,
        PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false"
      }
    });
    outcomes.push({
      browser: entry.browser,
      status: result.status === 0 && !result.error ? "passed" : "failed",
      exitCode: result.status,
      error: result.error?.message
    });
  }
  console.log(JSON.stringify({ unitMatrix: outcomes }, null, 2));
  if (outcomes.some((outcome) => outcome.status !== "passed")) process.exitCode = 1;
}
