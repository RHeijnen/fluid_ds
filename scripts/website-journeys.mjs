/* global HTMLAnchorElement, customElements, document, getComputedStyle, window */

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createWebsitePreview } from "./website-preview-harness.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tooling = createRequire(join(root, "apps/a11y/package.json"));
const playwright = tooling("@playwright/test");
const engines = ["chromium", "firefox", "webkit"];

function monitor(page, origin, allowedHttp = new Set()) {
  const diagnostics = [];
  const expectedNoise = [];
  page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      const text = message.text();
      if (
        allowedHttp.size &&
        text === "Failed to load resource: the server responded with a status of 404 (Not Found)"
      ) {
        expectedNoise.push(`expected console 404: ${text}`);
      } else {
        diagnostics.push(`console ${message.type()}: ${text}`);
      }
    }
  });
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText ?? "";
    if (error.includes("ERR_ABORTED")) {
      expectedNoise.push(`cancelled during navigation: ${request.url()} ${error}`);
    } else {
      diagnostics.push(`request failed: ${request.url()} ${error}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      const url = new URL(response.url());
      if (!allowedHttp.has(`${response.status()} ${url.pathname}`)) {
        diagnostics.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    }
  });
  return {
    diagnostics,
    expectedNoise,
    async blockExternal(route) {
      const url = new URL(route.request().url());
      if (url.origin === origin || ["blob:", "data:"].includes(url.protocol)) {
        await route.continue();
      } else {
        diagnostics.push(`external request: ${url}`);
        await route.abort();
      }
    }
  };
}

async function waitForLanding(page) {
  await page.waitForFunction(
    () => customElements.get("fluid-button") && customElements.get("fluid-switch")
  );
  await page.waitForLoadState("networkidle");
}

async function desktopJourneys(browser, preview, engine) {
  const context = await browser.newContext({
    colorScheme: "light",
    viewport: { width: 1280, height: 900 }
  });
  context.setDefaultTimeout(10_000);
  context.setDefaultNavigationTimeout(20_000);
  const page = await context.newPage();
  const observed = monitor(page, preview.origin, new Set(["404 /journey-missing-page"]));
  await context.route("**/*", (route) => observed.blockExternal(route));
  const cases = [];

  try {
    let response = await page.goto(`${preview.origin}/`);
    assert.equal(response?.status(), 200);
    await waitForLanding(page);
    assert.equal(
      await page.getByRole("heading", { level: 1 }).textContent(),
      "Build it once.Drop it anywhere."
    );
    await page.getByRole("link", { name: /Get started/ }).click();
    await page.waitForURL(`${preview.origin}/docs/`);
    await page.waitForLoadState("networkidle");
    assert.match(await page.title(), /Fluid/);
    cases.push("landing-to-mounted-docs");

    response = await page.goto(`${preview.origin}/docs`);
    await page.waitForLoadState("networkidle");
    assert.equal(response?.status(), 200);
    assert.equal(page.url(), `${preview.origin}/docs/`);
    assert.ok(
      preview.requests.some((request) => request.pathname === "/docs" && request.status === 301),
      "bare /docs request did not exercise the canonical redirect"
    );
    cases.push("docs-canonical-redirect");

    response = await page.goto(`${preview.origin}/docs/components/button/#as-a-link`);
    assert.equal(response?.status(), 200);
    await page.waitForLoadState("networkidle");
    const heading = page.locator("#as-a-link");
    await heading.scrollIntoViewIfNeeded();
    assert.equal(await heading.textContent(), "As a link");
    const linkDemo = page.locator(".fluid-doc-link-button").first();
    assert.ok(await linkDemo.isVisible());
    assert.equal(await linkDemo.locator("fluid-button, button").count(), 0);
    assert.equal(
      await page.evaluate(() => customElements.get("fluid-button") !== undefined),
      true,
      "documentation live components were not registered"
    );
    assert.equal(new URL(page.url()).hash, "#as-a-link");
    cases.push("docs-demo-and-anchor");

    response = await page.goto(`${preview.origin}/journey-missing-page`);
    assert.equal(response?.status(), 404);
    await page.waitForLoadState("networkidle");
    assert.match(await page.title(), /404/);
    assert.match((await page.locator("body").innerText()).toLowerCase(), /404|not found/);
    cases.push("real-404-response");

    await page.goto(`${preview.origin}/`);
    await waitForLanding(page);
    if (engine === "webkit") {
      // Headless WebKit follows Safari's default preference of omitting links
      // from sequential Tab order. Focus the real link explicitly, then keep
      // activation keyboard-only; Chromium and Firefox exercise Tab discovery.
      await page.getByRole("link", { name: "Docs", exact: true }).first().focus();
      assert.equal(
        await page.evaluate(() =>
          document.activeElement instanceof HTMLAnchorElement
            ? document.activeElement.pathname
            : null
        ),
        "/docs/"
      );
    } else {
      let focusedDocs = false;
      const focusTrail = [];
      for (let index = 0; index < 12; index++) {
        await page.keyboard.press("Tab");
        const active = await page.evaluate(() => ({
          href:
            document.activeElement instanceof HTMLAnchorElement
              ? document.activeElement.pathname
              : null,
          tag: document.activeElement?.tagName ?? null
        }));
        focusTrail.push(active);
        if (active.href === "/docs/") {
          focusedDocs = true;
          break;
        }
      }
      assert.equal(
        focusedDocs,
        true,
        `Docs navigation was not reachable by keyboard: ${JSON.stringify(focusTrail)}`
      );
    }
    await page.keyboard.press("Enter");
    await page.waitForURL(`${preview.origin}/docs/`);
    await page.waitForLoadState("networkidle");
    cases.push(
      engine === "webkit"
        ? "keyboard-link-activation-webkit-platform-tab-policy"
        : "keyboard-only-tab-navigation"
    );

    await page.goto(`${preview.origin}/`);
    await waitForLanding(page);
    const landingSurface = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--fluid-surface-base").trim()
    );
    await page.locator("#dark-toggle").click();
    await page.waitForFunction(() => document.documentElement.dataset.fluidTheme === "dark");
    const landingDarkSurface = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--fluid-surface-base").trim()
    );
    assert.notEqual(landingDarkSurface, landingSurface);

    await page.goto(`${preview.origin}/docs/`);
    await page.waitForLoadState("networkidle");
    const themeSelect = page.locator("starlight-theme-select select:visible").first();
    await themeSelect.selectOption("light");
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.theme === "light" &&
        document.documentElement.dataset.fluidTheme === "light"
    );
    const docsLightSurface = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--fluid-surface-base").trim()
    );
    await themeSelect.selectOption("dark");
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.theme === "dark" &&
        document.documentElement.dataset.fluidTheme === "dark"
    );
    const docsDarkSurface = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--fluid-surface-base").trim()
    );
    assert.notEqual(docsDarkSurface, docsLightSurface);
    cases.push("landing-and-docs-light-dark");

    await page.waitForLoadState("networkidle");
    assert.deepEqual(observed.diagnostics, []);
    return {
      cases,
      diagnostics: observed.diagnostics.length,
      expectedNavigationNoise: observed.expectedNoise.length
    };
  } finally {
    await context.close();
  }
}

async function mobileJourneys(browser, preview) {
  const context = await browser.newContext({
    colorScheme: "light",
    viewport: { width: 360, height: 740 }
  });
  context.setDefaultTimeout(10_000);
  context.setDefaultNavigationTimeout(20_000);
  const page = await context.newPage();
  const observed = monitor(page, preview.origin);
  await context.route("**/*", (route) => observed.blockExternal(route));
  try {
    assert.equal((await page.goto(`${preview.origin}/`))?.status(), 200);
    await waitForLanding(page);
    const landingLayout = await page.evaluate(() => {
      const nav = document.querySelector("nav.primary");
      const links = [...document.querySelectorAll("nav.primary a[href^='/']")];
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        navOverflow: nav ? getComputedStyle(nav).overflowX : "missing",
        visibleLinks: links.filter((link) => getComputedStyle(link).display !== "none").length
      };
    });
    assert.ok(
      landingLayout.documentWidth <= landingLayout.viewportWidth + 1,
      "landing overflows viewport"
    );
    assert.equal(landingLayout.navOverflow, "auto");
    assert.equal(landingLayout.visibleLinks, 5);

    assert.equal((await page.goto(`${preview.origin}/docs/components/button/`))?.status(), 200);
    await page.waitForLoadState("networkidle");
    const docsLayout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      mainWidth: document.querySelector("main")?.getBoundingClientRect().width ?? 0
    }));
    assert.ok(docsLayout.documentWidth <= docsLayout.viewportWidth + 1, "docs overflow viewport");
    assert.ok(docsLayout.mainWidth > 0 && docsLayout.mainWidth <= docsLayout.viewportWidth);
    await page.waitForLoadState("networkidle");
    assert.deepEqual(observed.diagnostics, []);
    return {
      cases: ["mobile-landing-nav", "mobile-docs-reflow"],
      diagnostics: 0,
      expectedNavigationNoise: observed.expectedNoise.length
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const preview = await createWebsitePreview();
  const results = [];
  let report;
  try {
    for (const engine of engines) {
      console.log(`Running website journeys in ${engine}...`);
      let browserServer;
      let browser;
      let result;
      let stage = "browser-startup";
      try {
        browserServer = await playwright[engine].launchServer({ timeout: 20_000 });
        browser = await playwright[engine].connect(browserServer.wsEndpoint(), { timeout: 20_000 });
        stage = "desktop-journeys";
        const desktop = await desktopJourneys(browser, preview, engine);
        stage = "mobile-journeys";
        const mobile = await mobileJourneys(browser, preview);
        result = {
          engine,
          cases: [...desktop.cases, ...mobile.cases],
          diagnostics: desktop.diagnostics + mobile.diagnostics,
          expectedNavigationNoise: desktop.expectedNavigationNoise + mobile.expectedNavigationNoise,
          processLifecycle: "running"
        };
        results.push(result);
      } catch (error) {
        throw new Error(`${engine} ${stage}: ${error.message}`, { cause: error });
      } finally {
        const disconnected = browser
          ? await browser.close().then(
              () => true,
              () => false
            )
          : true;
        const terminated = browserServer
          ? await browserServer.close().then(
              () => true,
              () => false
            )
          : true;
        if (result) {
          result.processLifecycle = disconnected && terminated ? "closed" : "cleanup-error";
          assert.equal(result.processLifecycle, "closed");
        }
      }
    }

    const unexpectedHttp = preview.requests.filter(
      (request) => request.status >= 400 && request.pathname !== "/journey-missing-page"
    );
    assert.deepEqual(unexpectedHttp, []);
    report = {
      origin: preview.origin,
      engines: results,
      httpRequests: preview.requests.length,
      separatelyBuiltAndExternalRoutes: "not fetched by this landing + docs harness",
      previewLifecycle: "running"
    };
  } finally {
    await preview.close();
  }
  report.previewLifecycle = "closed";
  console.log(JSON.stringify(report, null, 2));
}

await main();
