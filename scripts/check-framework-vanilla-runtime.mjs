/* global window */

import assert from "node:assert/strict";
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
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { checkFixtureIsolation } from "./framework-isolation.mjs";
import { runFrameworkCommand } from "./framework-commands.mjs";
import {
  artifactHashes,
  assertPortableLock,
  copyConsumer,
  createPackedOverrides
} from "./framework-packing.mjs";
import { startDistServer, terminateOwnedChild, withDeadline } from "./framework-runtime.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureDirectory = join(root, "apps/framework-vanilla");
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

async function assertPackedVanillaConsumer(directory) {
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
      assert.doesNotMatch(
        JSON.stringify(published.exports),
        /\.\/src\//,
        "Packed components exports workspace source"
      );
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

export async function runRuntime(consumerDirectory, evidenceDirectory) {
  const consumer = await assertPackedVanillaConsumer(consumerDirectory);
  const tooling = createRequire(join(root, "apps/a11y/package.json"));
  const playwright = tooling("@playwright/test");
  const expect = playwright.expect.configure({ timeout: 7000 });
  const server = await startDistServer(join(consumer, "dist"));
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

        stage = "static-html-boundary";
        const response = await page.goto(`${server.origin}/index.html`);
        assert.equal(response?.status(), 200);
        const markup = await response.text();
        if (engine === engines[0]) {
          await writeFile(join(evidenceDirectory, "server-response.html"), markup);
          await writeFile(
            join(evidenceDirectory, "ssr-negative-control.json"),
            `${JSON.stringify(
              {
                status: "expected-negative",
                assertion: "The authored Fluid hosts contain server-rendered component DSD",
                fluidHostCount: (markup.match(/<fluid-/g) ?? []).length,
                declarativeShadowRootCount: (markup.match(/shadowrootmode=/g) ?? []).length,
                cause:
                  "The no-framework fixture ships authored light DOM and a Vite client entry, not a server renderer."
              },
              null,
              2
            )}\n`
          );
        }
        assert.equal((markup.match(/<fluid-/g) ?? []).length, 4);
        assert.doesNotMatch(markup, /shadowrootmode=/);
        assert.doesNotMatch(markup, /(?:\/src\/|node_modules|packages\/components)/);

        stage = "before-registration";
        await page.waitForFunction(() => window.vanillaFluid?.ready === true);
        assert.deepEqual(
          await page.evaluate(() => window.vanillaFluid.definitionsBeforeRegistration),
          {
            "fluid-button": false,
            "fluid-card": false,
            "fluid-checkbox": false,
            "fluid-input": false
          }
        );
        assert.deepEqual(await page.evaluate(() => window.vanillaFluid.preRegistrationProperties), {
          value: "Direct property before registration",
          label: "Pre-registration property label"
        });
        assert.equal(
          await page.locator("fluid-card").evaluate((element) => element.shadowRoot),
          null
        );
        assert.deepEqual(await page.evaluate(() => window.vanillaFluid.references()), {
          cardMatchesDocument: true,
          inputMatchesDocument: true,
          checkboxMatchesDocument: true,
          buttonMatchesDocument: true
        });

        stage = "lazy-registration";
        await page.evaluate(() => window.vanillaFluid.register());
        await page.waitForFunction(
          () => window.vanillaFluid.registered || window.vanillaFluid.registrationError !== null
        );
        assert.equal(await page.evaluate(() => window.vanillaFluid.registrationError), null);
        for (const tag of ["fluid-button", "fluid-card", "fluid-checkbox", "fluid-input"]) {
          assert.equal(
            await page.locator(tag).evaluate((element) => element.matches(":defined")),
            true
          );
          assert.notEqual(await page.locator(tag).evaluate((element) => element.shadowRoot), null);
        }
        assert.deepEqual(
          await page.locator("#contract-card").evaluate((card) => {
            const assigned = (name) =>
              card.shadowRoot
                ?.querySelector(name ? `slot[name="${name}"]` : "slot:not([name])")
                ?.assignedElements()
                .map((element) => element.id) ?? [];
            return { header: assigned("header"), body: assigned(""), footer: assigned("footer") };
          }),
          {
            header: ["slot-header"],
            body: ["contract-form"],
            footer: ["slot-footer"]
          }
        );
        assert.deepEqual(
          await page.locator("#project").evaluate((input) => ({
            value: input.value,
            label: input.label,
            prefix:
              input.shadowRoot
                ?.querySelector('slot[name="prefix"]')
                ?.assignedElements()
                .map((element) => element.id) ?? []
          })),
          {
            value: "Direct property before registration",
            label: "Pre-registration property label",
            prefix: ["slot-prefix"]
          }
        );
        await expect(page.locator("#approved input")).toBeChecked();

        stage = "properties-events-refs-forms";
        await page.evaluate(() =>
          window.vanillaFluid.setProject("Direct property after registration")
        );
        await expect(page.locator("#project input")).toHaveValue(
          "Direct property after registration"
        );
        await page.evaluate(() => window.vanillaFluid.setLabel("Direct label property"));
        await expect(page.locator("#project label")).toContainText("Direct label property");
        const input = page.locator("#project input");
        await input.fill("Typed without a framework");
        await input.blur();
        assert.deepEqual(await page.evaluate(() => window.vanillaFluid.events.slice(0, 2)), [
          { type: "fluid-input", detail: { value: "Typed without a framework" } },
          { type: "fluid-change", detail: { value: "Typed without a framework" } }
        ]);
        await page.locator("#approved label").click();
        await expect(page.locator("#approved input")).not.toBeChecked();
        assert.deepEqual(await page.evaluate(() => window.vanillaFluid.events.at(-1)), {
          type: "fluid-change",
          detail: { checked: false }
        });
        await page.locator("#approved label").click();
        await page.getByRole("button", { name: "Save project", exact: true }).click();
        await expect(page.locator("#contract-output")).toHaveText(
          '[["project","Typed without a framework"],["approved","yes"]]'
        );
        assert.deepEqual(await page.evaluate(() => window.vanillaFluid.submissions), [
          [
            ["project", "Typed without a framework"],
            ["approved", "yes"]
          ]
        ]);
        await page.getByRole("button", { name: "Reset project", exact: true }).click();
        await expect(input).toHaveValue("Reset value");
        await expect(page.locator("#approved input")).toBeChecked();
        assert.deepEqual(await page.evaluate(() => window.vanillaFluid.references()), {
          cardMatchesDocument: true,
          inputMatchesDocument: true,
          checkboxMatchesDocument: true,
          buttonMatchesDocument: true
        });
        assert.deepEqual(
          errors,
          [],
          "Plain consumer emitted console, page, network or HTTP errors"
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
    framework: "Plain TypeScript/HTML",
    mode: "packed-production-static-HTML-with-lazy-custom-element-registration",
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
  const evidenceDirectory = join(root, "quality/evidence/framework-vanilla", timestamp);
  const tempRoot = await mkdtemp(join(tmpdir(), "fluid-vanilla-packed-"));
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
    manifest.name = "@fluid-ds/framework-vanilla-packed-contract";
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
    await assertPackedVanillaConsumer(consumerDirectory);
    await run(["run", "typecheck"], consumerDirectory, "typecheck");
    await run(["run", "build"], consumerDirectory, "build");
    runtime = await runRuntime(consumerDirectory, join(evidenceDirectory, "runtime"));
    assert.equal(runtime.status, "passed", "Packed plain consumer runtime contract failed");
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
          framework: "Plain TypeScript/HTML",
          lane: "latest-compatible-packed-production-runtime",
          node: process.version,
          platform: process.platform,
          packageManager: "pnpm@9.15.0",
          commandOutcomes,
          runtimeStatus: runtime.status,
          commands: [
            "pnpm --filter @fluid-ds/framework-vanilla typecheck",
            "pnpm --filter @fluid-ds/framework-vanilla build",
            "node scripts/check-framework-vanilla-runtime.mjs"
          ],
          limitations: [
            "This fixture ships authored static light DOM and client JavaScript; it has no server renderer, DSD, or hydration contract.",
            "This latest-compatible lane retains a portable lock and tarballs but does not perform a second frozen replay.",
            "Four representative core elements do not certify the full component catalog or framework integrations.",
            "Tarballs use the repository's existing built dist; source-to-dist equivalence remains covered by separate package build and artifact gates."
          ]
        },
        null,
        2
      )}\n`
    );
    console.log(`Retained packed plain-consumer evidence: ${evidenceDirectory}`);
    if (tempRoot.startsWith(`${tmpdir()}${sep}fluid-vanilla-packed-`)) {
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
