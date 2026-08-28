/* global window */

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { checkFixtureIsolation } from "./framework-isolation.mjs";
import { runFrameworkCommand } from "./framework-commands.mjs";
import {
  artifactHashes,
  assertPortableLock,
  copyConsumer,
  createPackedOverrides
} from "./framework-packing.mjs";
import { terminateOwnedChild, withDeadline } from "./framework-runtime.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureDirectory = join(root, "apps/framework-sveltekit");
const engines = ["chromium", "firefox", "webkit"];
const packageNames = ["@fluid-ds/tokens", "@fluid-ds/icons", "@fluid-ds/components"];

function within(parent, candidate) {
  const path = relative(parent, candidate);
  return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
}

async function packageRecord(name) {
  const directory = join(root, "packages", name.split("/")[1]);
  return {
    directory,
    manifest: JSON.parse(await readFile(join(directory, "package.json"), "utf8"))
  };
}

async function assertPackedSvelteKitConsumer(directory) {
  const consumer = await realpath(directory);
  const manifest = JSON.parse(await readFile(join(consumer, "package.json"), "utf8"));
  for (const name of ["@fluid-ds/components", "@fluid-ds/tokens"]) {
    assert.match(
      manifest.dependencies?.[name] ?? "",
      /^file:\.\.\/packs\/[^/]+\.tgz$/,
      `${name} is not a retained tarball dependency`
    );
    const installed = await realpath(join(consumer, "node_modules", ...name.split("/")));
    assert.ok(within(consumer, installed), `${name} resolves outside the packed consumer`);
    const published = JSON.parse(await readFile(join(installed, "package.json"), "utf8"));
    assert.ok(published.exports, `${name} has no published exports`);
    if (name === "@fluid-ds/components") {
      const exports = JSON.stringify(published.exports);
      assert.doesNotMatch(exports, /\.\/src\//, "Packed components exports workspace source");
      assert.match(exports, /\.\/dist\/ssr\.js/, "Packed SSR entry is not built JS");
      assert.match(exports, /\.\/dist\/ssr-client\.js/, "Packed SSR client entry is not built JS");
    }
  }
  const components = await realpath(join(consumer, "node_modules/@fluid-ds/components"));
  const icons = await realpath(join(components, "../icons"));
  assert.ok(within(consumer, icons), "Packed icons dependency resolves outside the consumer");
  assert.equal(
    JSON.parse(await readFile(join(icons, "package.json"), "utf8")).name,
    "@fluid-ds/icons"
  );
  return consumer;
}

async function startSvelteStaticServer(directory) {
  const servedRoot = await realpath(directory);
  const mime = {
    ".css": "text/css",
    ".html": "text/html",
    ".ico": "image/x-icon",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
  };
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        throw new Error("Method not allowed");
      }
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      const segments = pathname.split(/[\\/]/);
      if (
        segments.some(
          (part) =>
            part.startsWith(".") || ["@fs", "src", "node_modules", "packages"].includes(part)
        )
      ) {
        throw new Error("Source access denied");
      }
      const assetPath = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
      const file = await realpath(resolve(servedRoot, `.${assetPath}`));
      const type = mime[extname(file)];
      if (!within(servedRoot, file) || !type || !(await stat(file)).isFile()) {
        throw new Error("Outside production assets");
      }
      response.writeHead(200, { "cache-control": "no-store", "content-type": type });
      response.end(request.method === "HEAD" ? undefined : await readFile(file));
    } catch {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Not found");
    }
  });
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", accept);
  });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => {
      server.closeAllConnections();
      return new Promise((accept, reject) =>
        server.close((error) => (error ? reject(error) : accept()))
      );
    }
  };
}

export async function runRuntime(consumerDirectory, evidenceDirectory) {
  const consumer = await assertPackedSvelteKitConsumer(consumerDirectory);
  const tooling = createRequire(join(root, "apps/a11y/package.json"));
  const playwright = tooling("@playwright/test");
  const expect = playwright.expect.configure({ timeout: 7000 });
  const server = await startSvelteStaticServer(join(consumer, "build"));
  const results = [];
  const failures = [];
  const cleanup = [];
  await mkdir(evidenceDirectory, { recursive: true });

  try {
    for (const engine of engines) {
      let browserServer;
      let browser;
      let context;
      let stage = "browser-startup";
      const errors = [];
      try {
        browserServer = await playwright[engine].launchServer({ timeout: 15000 });
        browser = await playwright[engine].connect(browserServer.wsEndpoint(), {
          timeout: 15000
        });
        context = await browser.newContext();
        context.setDefaultTimeout(7000);
        context.setDefaultNavigationTimeout(15000);
        await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
        const page = await context.newPage();
        page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
        page.on("console", (message) => {
          if (["error", "warning"].includes(message.type())) {
            errors.push(`${message.type()}: ${message.text()}`);
          }
        });
        page.on("requestfailed", (request) =>
          errors.push(`request: ${request.url()} ${request.failure()?.errorText}`)
        );
        page.on("response", (response) => {
          if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
        });
        await context.route("**/*", (route) => {
          const url = new URL(route.request().url());
          if (url.origin === server.origin || ["data:", "blob:"].includes(url.protocol)) {
            return route.continue();
          }
          errors.push(`External request: ${url}`);
          return route.abort();
        });

        stage = "server-response";
        const response = await page.goto(`${server.origin}/`);
        assert.equal(response?.status(), 200);
        const markup = await response.text();
        if (engine === engines[0]) {
          await writeFile(join(evidenceDirectory, "server-response.html"), markup);
        }
        assert.equal(
          (markup.match(/shadowrootmode="open"/g) ?? []).length,
          4,
          "SvelteKit prerender must contain four Fluid declarative shadow roots"
        );
        assert.match(
          markup,
          /<fluid-input(?=[^>]*id="project")[^>]*>\s*<template[^>]*shadowrootdelegatesfocus/,
          "Input DSD must retain delegated focus"
        );
        assert.doesNotMatch(markup, /(?:\/src\/|node_modules|packages\/components)/);

        stage = "before-registration";
        await page.waitForFunction(() => window.svelteFluid?.ready === true);
        assert.deepEqual(
          await page.evaluate(() => window.svelteFluid.definitionsBeforeRegistration),
          {
            "fluid-button": false,
            "fluid-card": false,
            "fluid-checkbox": false,
            "fluid-input": false
          }
        );
        assert.equal(await page.evaluate(() => window.svelteFluid.assertServerNodes()), 4);
        assert.deepEqual(await page.evaluate(() => window.svelteFluid.slotAssignments()), {
          header: ["slot-header"],
          body: ["contract-form"],
          footer: ["slot-footer"],
          prefix: ["slot-prefix"]
        });
        const input = page.locator("#project input");
        await input.fill("Edited before registration");
        await page.locator("#approved label").click();
        await expect(page.locator("#approved input")).not.toBeChecked();
        await input.focus();
        await page.keyboard.press("Home");
        await page.keyboard.press("Shift+ArrowRight");
        const selection = await input.evaluate((element) => [
          element.selectionStart,
          element.selectionEnd,
          element.selectionDirection
        ]);
        assert.deepEqual(await page.evaluate(() => window.svelteFluid.events), []);

        stage = "registration-and-hydration";
        await page.evaluate(() => window.svelteFluid.register());
        await page.waitForFunction(
          () => window.svelteFluid.hydrated || window.svelteFluid.hydrationError !== null
        );
        assert.equal(await page.evaluate(() => window.svelteFluid.hydrationError), null);
        assert.equal(await page.evaluate(() => window.svelteFluid.assertServerNodes()), 4);
        assert.deepEqual(await page.evaluate(() => window.svelteFluid.slotAssignments()), {
          header: ["slot-header"],
          body: ["contract-form"],
          footer: ["slot-footer"],
          prefix: ["slot-prefix"]
        });
        await expect(input).toHaveValue("Edited before registration");
        await expect(input).toBeFocused();
        assert.deepEqual(
          await input.evaluate((element) => [
            element.selectionStart,
            element.selectionEnd,
            element.selectionDirection
          ]),
          selection
        );
        assert.deepEqual(
          await page.locator("#contract-form").evaluate((form) => ({
            project: form.querySelector("#project").value,
            approved: form.querySelector("#approved").checked,
            data: [...new FormData(form)]
          })),
          {
            project: "Edited before registration",
            approved: false,
            data: [["project", "Edited before registration"]]
          }
        );
        assert.deepEqual(await page.evaluate(() => window.svelteFluid.events), []);

        stage = "properties-events-slots-forms";
        await page.locator("#project").evaluate(async (element) => {
          element.label = "Updated property label";
          element.helpText = "Updated property help";
          await element.updateComplete;
        });
        await expect(page.locator("#project label")).toContainText("Updated property label");
        await expect(page.locator("#project")).toContainText("Updated property help");
        await input.fill("Edited after hydration");
        await page.locator("#approved label").click();
        await page.getByRole("button", { name: "Save project", exact: true }).click();
        await expect(page.locator("#contract-output")).toHaveText(
          '[["project","Edited after hydration"],["approved","yes"]]'
        );
        assert.deepEqual(await page.evaluate(() => window.svelteFluid.submissions), [
          [
            ["project", "Edited after hydration"],
            ["approved", "yes"]
          ]
        ]);
        assert.deepEqual(
          await page.evaluate(() => window.svelteFluid.events.at(-1)),
          { type: "fluid-input", value: "Edited after hydration" },
          "Hydrated Fluid input event did not cross the Svelte boundary"
        );
        await page.getByRole("button", { name: "Reset project", exact: true }).click();
        await expect(input).toHaveValue("Server value");
        await expect(page.locator("#approved input")).toBeChecked();
        assert.equal(await page.evaluate(() => window.svelteFluid.assertServerNodes()), 4);
        assert.deepEqual(
          errors,
          [],
          "SvelteKit page emitted console, page, network or HTTP errors"
        );

        results.push({ engine, version: browser.version(), status: "passed" });
      } catch (error) {
        failures.push({
          engine,
          stage,
          error: String(error instanceof Error ? error.stack : error),
          errors
        });
        results.push({ engine, version: browser?.version(), status: "failed", stage });
      } finally {
        if (context) {
          try {
            await withDeadline(
              context.tracing.stop({ path: join(evidenceDirectory, `${engine}.zip`) }),
              10000,
              `${engine} trace shutdown`
            );
          } catch (error) {
            failures.push({ engine, stage: "trace-shutdown", error: String(error) });
          }
          try {
            await withDeadline(context.close(), 10000, `${engine} context shutdown`);
          } catch (error) {
            failures.push({ engine, stage: "context-shutdown", error: String(error) });
          }
        }
        if (browser) {
          try {
            await withDeadline(browser.close(), 10000, `${engine} browser shutdown`);
          } catch (error) {
            failures.push({ engine, stage: "browser-shutdown", error: String(error) });
          }
        }
        if (browserServer) {
          try {
            await withDeadline(browserServer.close(), 10000, `${engine} server shutdown`);
            cleanup.push({ engine, status: "server-exit-observed" });
          } catch (error) {
            const record = { engine, status: "forced-direct-child-cleanup", error: String(error) };
            try {
              Object.assign(record, await terminateOwnedChild(browserServer.process()));
            } catch (cleanupError) {
              record.cleanupError = String(cleanupError);
            }
            cleanup.push(record);
            failures.push({ engine, stage: "server-shutdown", error: String(error) });
          }
        }
      }
    }
  } finally {
    await server.close();
  }

  const report = {
    status:
      failures.length === 0 &&
      results.length === engines.length &&
      results.every((result) => result.status === "passed")
        ? "passed"
        : "failed",
    framework: "SvelteKit",
    mode: "packed-production-prerender-with-DSD-and-delayed-client-registration",
    engines,
    results,
    failures,
    cleanup
  };
  await writeFile(join(evidenceDirectory, "runtime.json"), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

async function main() {
  await checkFixtureIsolation(fixtureDirectory);
  const records = await Promise.all(packageNames.map(packageRecord));
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const evidenceDirectory = join(root, "quality/evidence/framework-sveltekit", timestamp);
  const tempRoot = await mkdtemp(join(tmpdir(), "fluid-sveltekit-packed-"));
  const packsDirectory = join(tempRoot, "packs");
  const consumerDirectory = join(tempRoot, "fixture");
  const commandOutcomes = [];
  let status = "failed";
  let runtime = { status: "not-run" };

  const run = (args, cwd, stage, label = stage, quiet = false) =>
    runFrameworkCommand(args, {
      cwd,
      stage,
      quiet,
      outcomes: commandOutcomes,
      logPath: join(evidenceDirectory, `${label}.log`)
    });

  await mkdir(packsDirectory, { recursive: true });
  try {
    const packedDependencies = {};
    for (const record of records) {
      await run(
        ["pack", "--pack-destination", packsDirectory],
        record.directory,
        "pack",
        `pack-${record.manifest.name.replaceAll(/[^a-z0-9-]/gi, "-")}`,
        true
      );
      const prefix = record.manifest.name.replace(/^@/, "").replace("/", "-");
      const tarball = (await readdir(packsDirectory)).find(
        (file) => file === `${prefix}-${record.manifest.version}.tgz`
      );
      assert.ok(tarball, `No tarball produced for ${record.manifest.name}`);
      packedDependencies[record.manifest.name] = `file:${relative(
        consumerDirectory,
        join(packsDirectory, tarball)
      )
        .split(sep)
        .join("/")}`;
    }

    await copyConsumer(fixtureDirectory, consumerDirectory);
    await checkFixtureIsolation(consumerDirectory);
    const manifestPath = join(consumerDirectory, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const group of ["dependencies", "devDependencies", "optionalDependencies"]) {
      for (const dependency of Object.keys(manifest[group] ?? {})) {
        if (packedDependencies[dependency])
          manifest[group][dependency] = packedDependencies[dependency];
      }
    }
    manifest.name = "@fluid-ds/framework-sveltekit-packed-contract";
    manifest.packageManager = "pnpm@9.15.0";
    manifest.pnpm = {
      ...(manifest.pnpm ?? {}),
      overrides: createPackedOverrides(records, packedDependencies)
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    await run(
      ["install", "--no-frozen-lockfile", "--ignore-scripts", "--strict-peer-dependencies"],
      consumerDirectory,
      "install"
    );
    assertPortableLock(await readFile(join(consumerDirectory, "pnpm-lock.yaml"), "utf8"));
    await assertPackedSvelteKitConsumer(consumerDirectory);
    await run(["run", "typecheck"], consumerDirectory, "typecheck");
    await run(["run", "build"], consumerDirectory, "build");
    runtime = await runRuntime(consumerDirectory, join(evidenceDirectory, "runtime"));
    assert.equal(runtime.status, "passed", "Packed SvelteKit runtime contract failed");
    status = "passed";
  } finally {
    await mkdir(evidenceDirectory, { recursive: true });
    await cp(packsDirectory, join(evidenceDirectory, "packs"), { recursive: true });
    if (await stat(consumerDirectory).catch(() => null)) {
      await copyConsumer(consumerDirectory, join(evidenceDirectory, "fixture"));
    }
    const hashes = await artifactHashes(evidenceDirectory).catch((error) => ({
      error: String(error)
    }));
    await writeFile(
      join(evidenceDirectory, "artifact-hashes.json"),
      `${JSON.stringify(hashes, null, 2)}\n`
    );
    await writeFile(
      join(evidenceDirectory, "result.json"),
      `${JSON.stringify(
        {
          status,
          framework: "SvelteKit",
          lane: "latest-compatible-packed-production-runtime",
          node: process.version,
          platform: process.platform,
          packageManager: "pnpm@9.15.0",
          commandOutcomes,
          runtimeStatus: runtime.status,
          commands: [
            "pnpm --filter @fluid-ds/framework-sveltekit typecheck",
            "pnpm --filter @fluid-ds/framework-sveltekit build",
            "node scripts/check-framework-sveltekit-ssr.mjs"
          ],
          limitations: [
            "The fixture uses adapter-static with prerender=true; DSD is generated during the production build, not by a request-time SvelteKit server.",
            "This latest-compatible lane retains a portable lock and tarballs but does not perform a second frozen replay.",
            "Four representative core elements do not certify the full component catalog or other frameworks.",
            "Tarballs use the repository's existing built dist; source-to-dist equivalence remains covered by separate package build and artifact gates."
          ]
        },
        null,
        2
      )}\n`
    );
    console.log(`Retained packed SvelteKit evidence: ${evidenceDirectory}`);
    if (tempRoot.startsWith(`${tmpdir()}${sep}fluid-sveltekit-packed-`)) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }

  if (status !== "passed") process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
