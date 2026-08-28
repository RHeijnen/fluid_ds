import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { platform, release, arch, cpus } from "node:os";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const require = createRequire(new URL("apps/a11y/package.json", root));
const { chromium, firefox, webkit } = require("@playwright/test");
const playwrightRequire = createRequire(require.resolve("@playwright/test/package.json"));
const coreRequire = createRequire(playwrightRequire.resolve("playwright/package.json"));
const browsers = JSON.parse(
  await readFile(
    join(dirname(coreRequire.resolve("playwright-core/package.json")), "browsers.json"),
    "utf8"
  )
);
const pnpm = spawnSync(
  process.platform === "win32" ? "corepack.cmd" : "corepack",
  ["pnpm", "--version"],
  { shell: process.platform === "win32", encoding: "utf8" }
);
const result = {
  node: process.version,
  platform: platform(),
  release: release(),
  arch: arch(),
  cpu: cpus()[0]?.model,
  logicalCpus: cpus().length,
  pnpm: pnpm.stdout.trim(),
  playwright: require("@playwright/test/package.json").version,
  browserRevisions: browsers.browsers,
  browserLaunch: {},
  fixtures: {}
};
for (const name of [
  "admin-react",
  "admin-next",
  "admin-angular",
  "framework-vue",
  "framework-astro",
  "framework-sveltekit"
]) {
  const path = new URL(`apps/${name}/package.json`, root);
  const manifest = JSON.parse(await readFile(path, "utf8"));
  const localRequire = createRequire(path);
  result.fixtures[name] = {};
  for (const dependency of [
    "react",
    "next",
    "@angular/core",
    "vue",
    "astro",
    "svelte",
    "@sveltejs/kit"
  ]) {
    if (!manifest.dependencies?.[dependency] && !manifest.devDependencies?.[dependency]) continue;
    try {
      result.fixtures[name][dependency] = localRequire(`${dependency}/package.json`).version;
    } catch {
      result.fixtures[name][dependency] = {
        declared: manifest.dependencies?.[dependency] ?? manifest.devDependencies[dependency],
        installedVersion: "not resolved"
      };
    }
  }
}
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  let browser;
  try {
    browser = await engine.launch({ timeout: 15000 });
    result.browserLaunch[name] = {
      status: "passed",
      version: browser.version(),
      executable: engine.executablePath()
    };
    if (name === "chromium") {
      const page = await browser.newPage();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("HeapProfiler.enable");
      await cdp.send("HeapProfiler.collectGarbage");
      const before = await cdp.send("Performance.getMetrics");
      await cdp.send("Performance.enable");
      const after = await cdp.send("Performance.getMetrics");
      await page.setContent("<!doctype html><body></body>");
      await page.evaluate(() =>
        globalThis.customElements.define("audit-probe", class extends globalThis.HTMLElement {})
      );
      await page.setContent("<!doctype html><body><audit-probe></audit-probe></body>");
      result.benchmarkProbe = {
        metricCountWithoutPerformanceEnable: before.metrics.length,
        metricCountWithPerformanceEnable: after.metrics.length,
        registrySurvivesSetContent: await page.evaluate(() =>
          Boolean(globalThis.customElements.get("audit-probe"))
        )
      };
    }
  } catch (error) {
    result.browserLaunch[name] = {
      status: "failed",
      executable: engine.executablePath(),
      error: error.message
    };
  } finally {
    await browser?.close();
  }
}
console.log(JSON.stringify(result, null, 2));
if (Object.values(result.browserLaunch).some(({ status }) => status === "failed"))
  process.exitCode = 1;
