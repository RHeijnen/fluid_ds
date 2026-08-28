import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const engines = ["chromium", "firefox", "webkit"];
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

export async function withDeadline(operation, milliseconds, label) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} exceeded ${milliseconds}ms`)),
          milliseconds
        );
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function terminateOwnedChild(child, timeoutMs = 5000) {
  const result = {
    directChildExitObserved: false,
    terminationRequested: false,
    descendantCleanup: "unknown-not-inspected"
  };
  if (!child) throw new Error("Owned browser ChildProcess handle is unavailable");
  if (child.exitCode !== null || child.signalCode !== null) {
    result.directChildExitObserved = true;
    return result;
  }
  let onExit;
  const exited = new Promise((accept) => {
    onExit = () => {
      result.directChildExitObserved = true;
      accept();
    };
    child.once("exit", onExit);
  });
  try {
    result.terminationRequested = true;
    result.terminationAccepted = child.kill("SIGKILL");
    await withDeadline(exited, timeoutMs, "Owned browser direct-child shutdown");
    return result;
  } finally {
    child.removeListener("exit", onExit);
  }
}

export function removeWorkspaceLifecycleScripts(scripts = {}) {
  const result = { ...scripts };
  // Remove only named lifecycle hooks. `preview` and `prepare-data` are commands.
  for (const name of ["predev", "prebuild", "pretest", "pretypecheck", "prepreview", "prestart"]) {
    delete result[name];
  }
  return result;
}

function within(parent, candidate) {
  const path = relative(parent, candidate);
  return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
}

export async function assertPackedConsumer(
  directory,
  requiredDependencies = ["@fluid-ds/react", "@fluid-ds/components"]
) {
  const consumer = await realpath(directory);
  const manifest = JSON.parse(await readFile(join(consumer, "package.json"), "utf8"));
  const dependencies = { ...manifest.dependencies, ...manifest.optionalDependencies };
  for (const name of requiredDependencies)
    assert.ok(dependencies[name], `Missing required dependency: ${name}`);
  for (const name of Object.keys(dependencies).filter((name) => name.startsWith("@fluid-ds/"))) {
    const dependency = dependencies[name];
    assert.match(
      dependency ?? "",
      /^file:\.\.\/packs\/[^/]+\.tgz$/,
      `${name} must come from a retained tarball`
    );
    await stat(resolve(consumer, dependency.slice(5)));
    const installed = await realpath(join(consumer, "node_modules", ...name.split("/")));
    assert.ok(within(consumer, installed), `${name} resolves outside the packed consumer`);
    const published = JSON.parse(await readFile(join(installed, "package.json"), "utf8"));
    assert.ok(published.exports, `${name} has no published entry points`);
    // These compiled packages must use published JS, not workspace TS aliases.
    // Themes intentionally publish CSS from src; their realpath must still be local.
    if (["@fluid-ds/react", "@fluid-ds/components"].includes(name)) {
      assert.doesNotMatch(
        JSON.stringify(published.exports),
        /\.\/src\//,
        `${name} exports workspace source`
      );
    }
  }
  return consumer;
}

/** A production-only server. There is no workspace root, dev transform, or fallback. */
export async function startDistServer(directory) {
  const servedRoot = await realpath(directory);
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD")
        throw new Error("Method not allowed");
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
      const file = await realpath(
        resolve(servedRoot, `.${pathname === "/" ? "/contract.html" : pathname}`)
      );
      if (!within(servedRoot, file) || !mime[extname(file)] || !(await stat(file)).isFile()) {
        throw new Error("Outside production assets");
      }
      response.writeHead(200, { "content-type": mime[extname(file)], "cache-control": "no-store" });
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

async function wrapperEvents(page, expect) {
  const input = page.locator("#wrapped-input input");
  await input.pressSequentially("Ada");
  await page.getByRole("button", { name: "Rerender children", exact: true }).click();
  await expect(
    page.locator("#events"),
    "WRAPPER_EVENT: native typing reaches React exactly once per keystroke"
  ).toHaveText('["A","Ad","Ada"]');
  await expect(page.locator("#changes")).toHaveText('["Ada"]');
  await expect(input).toHaveValue("Ada");
  await expect(page.locator("#controlled-value")).toHaveText("Ada");
  await page.getByRole("button", { name: "Set controlled value", exact: true }).click();
  await expect(input).toHaveValue("External");
  await expect(page.locator("#events")).toHaveText('["A","Ad","Ada"]');
  await page.getByRole("button", { name: "Toggle pressed", exact: true }).click();
  await page.getByRole("button", { name: "Toggle pressed", exact: true }).click();
  await expect(page.locator("#pressed")).toHaveText("[true,false]");
}

const contracts = [
  ["wrapper-events-and-controlled-property", wrapperEvents],
  [
    "native-jsx-event",
    async (page, expect) => {
      await page.locator("#native-input input").pressSequentially("Native");
      await page.getByRole("button", { name: "Rerender children", exact: true }).click();
      await expect(page.locator("#native-events")).toHaveText('["Native"]');
    }
  ],
  [
    "object-property-and-selection",
    async (page, expect) => {
      const host = page.locator("#object-input");
      await expect
        .poll(() => host.evaluate((element) => element.options))
        .toEqual([{ value: "nl", label: "Netherlands", data: { region: "EU", revision: 1 } }]);
      await page.getByRole("button", { name: "Replace options", exact: true }).click();
      await expect
        .poll(() => host.evaluate((element) => element.options))
        .toEqual([{ value: "de", label: "Germany", data: { region: "EU", revision: 2 } }]);
      const input = host.locator("input");
      await input.click();
      await input.pressSequentially("Ger");
      await expect(page.locator("#queries")).toHaveText('["G","Ge","Ger"]');
      await input.press("ArrowDown");
      await input.press("Enter");
      await expect
        .poll(async () => JSON.parse(await page.locator("#selection").innerText()))
        .toEqual({
          value: "de",
          label: "Germany",
          option: { value: "de", label: "Germany", data: { region: "EU", revision: 2 } }
        });
      await expect(input).toHaveValue("Germany");
    }
  ],
  [
    "refs-remount-and-listener-cleanup",
    async (page, expect) => {
      await expect(page.locator("#ref-state")).toHaveText("fluid-input");
      await page.getByRole("button", { name: "Focus ref", exact: true }).click();
      await expect(page.locator("#wrapped-input input")).toBeFocused();
      const clears = Number(await page.locator("#ref-clears").innerText());
      await page.getByRole("button", { name: "Toggle field", exact: true }).click();
      await expect(page.locator("#wrapped-input")).toHaveCount(0);
      await expect(page.locator("#ref-state")).toHaveText("empty");
      await expect
        .poll(async () => Number(await page.locator("#ref-clears").innerText()))
        .toBeGreaterThan(clears);
      await page.getByRole("button", { name: "Toggle field", exact: true }).click();
      await expect(page.locator("#ref-state")).toHaveText("fluid-input");
      await page.getByRole("button", { name: "Focus ref", exact: true }).click();
      await expect(page.locator("#wrapped-input input")).toBeFocused();
      await page.locator("#wrapped-input input").pressSequentially("R");
      await expect(page.locator("#events")).toHaveText('["R"]');
    }
  ],
  [
    "form-validation-submit-disabled-reset",
    async (page, expect) => {
      const input = page.locator("#wrapped-input input");
      await page.getByRole("button", { name: "Submit project", exact: true }).click();
      await expect(page.locator("#submitted")).toHaveText("[]");
      assert.equal(
        await page.locator("#contract-form").evaluate((form) => form.checkValidity()),
        false
      );
      await input.pressSequentially("Project");
      await page.getByRole("button", { name: "Cancel submit", exact: true }).click();
      await expect(page.locator("#submitted")).toHaveText("[]");
      await expect(page.locator("#activations")).toHaveText(
        '[{"detail":null,"cancelable":true,"defaultPrevented":true}]'
      );
      await page.getByRole("button", { name: "Submit project", exact: true }).click();
      await expect(page.locator("#submitted")).toHaveText('[{"project":"Project"}]');
      await page.getByRole("button", { name: "Toggle disabled", exact: true }).click();
      await expect(input).toBeDisabled();
      await page.getByRole("button", { name: "Submit project", exact: true }).click();
      await expect(page.locator("#submitted")).toHaveText('[{"project":"Project"},{}]');
      await page.getByRole("button", { name: "Toggle disabled", exact: true }).click();
      await page.getByRole("button", { name: "Reset project", exact: true }).click();
      await expect(input).toHaveValue("");
      await expect(page.locator("#controlled-value")).toBeEmpty();
      assert.equal(
        await page.locator("#contract-form").evaluate((form) => form.checkValidity()),
        false
      );
    }
  ],
  [
    "react-children-and-named-slots",
    async (page, expect) => {
      const assigned = () =>
        page.locator("#contract-card").evaluate((card) => {
          const named = (name) =>
            card.shadowRoot
              .querySelector(`slot${name ? `[name="${name}"]` : ":not([name])"}`)
              .assignedElements()
              .map((element) => element.textContent);
          return {
            header: named("header"),
            footer: named("footer"),
            body: card.shadowRoot
              .querySelector("slot:not([name])")
              .assignedElements()
              .map((element) => element.id)
          };
        });
      await expect
        .poll(assigned)
        .toEqual({ header: ["Header 0"], footer: ["Footer 0"], body: ["contract-form"] });
      await page.getByRole("button", { name: "Rerender children", exact: true }).click();
      await expect
        .poll(assigned)
        .toEqual({ header: ["Header 1"], footer: ["Footer 1"], body: ["contract-form"] });
      await expect
        .poll(() =>
          page
            .locator("#wrapped-input")
            .evaluate(
              (element) =>
                element.shadowRoot.querySelector('slot[name="prefix"]').assignedElements()[0]
                  ?.textContent
            )
        )
        .toBe("Prefix 1");
    }
  ]
];

export const runtimeContractNames = [
  ...contracts.map(([name]) => name),
  "negative-control-missing-wrapper-listener"
];

export function isRuntimeComplete(results, failures) {
  return (
    failures.length === 0 &&
    results.length === engines.length * runtimeContractNames.length &&
    engines.every((engine) =>
      runtimeContractNames.every((contract) => {
        const matches = results.filter(
          (result) => result.engine === engine && result.contract === contract
        );
        return matches.length === 1 && matches[0].status === "passed";
      })
    )
  );
}

export async function runReactRuntime(directory, evidenceDirectory) {
  const consumer = await assertPackedConsumer(directory);
  await mkdir(evidenceDirectory, { recursive: true });
  const react = JSON.parse(
    await readFile(join(consumer, "node_modules/react/package.json"), "utf8")
  );
  // The driver is tooling only. Browser assets exclusively come from packed dist.
  const tooling = createRequire(join(root, "apps/a11y/package.json"));
  const playwright = tooling("@playwright/test");
  const expect = playwright.expect.configure({ timeout: 5000 });
  const server = await startDistServer(join(consumer, "dist"));
  const results = [];
  const failures = [];
  const report = {
    status: "running",
    browserRuntimeTested: false,
    framework: "React 19",
    reactVersion: react.version,
    mode: "packed-production-csr",
    engines,
    cleanup: [],
    results,
    failures
  };
  const persist = () =>
    writeFile(join(evidenceDirectory, "runtime.json"), `${JSON.stringify(report, null, 2)}\n`);
  const teardown = async (operation, stage, engine, contract) => {
    try {
      await withDeadline(operation(), 10000, stage);
      return true;
    } catch (error) {
      failures.push({ engine, contract, stage, error: String(error.stack ?? error) });
      await persist();
      return false;
    }
  };
  await persist();
  try {
    for (const engine of engines) {
      let browser;
      let browserServer;
      let stage = "engine-startup";
      try {
        browserServer = await playwright[engine].launchServer({ timeout: 15000 });
        browser = await playwright[engine].connect(browserServer.wsEndpoint(), { timeout: 15000 });
        for (const [name, check] of [
          ...contracts,
          ["negative-control-missing-wrapper-listener", wrapperEvents]
        ]) {
          const negative = name.startsWith("negative-control");
          stage = "contract-setup";
          const context = await withDeadline(browser.newContext(), 10000, stage);
          context.setDefaultTimeout(5000);
          context.setDefaultNavigationTimeout(10000);
          const errors = [];
          let contextClosed = false;
          try {
            await withDeadline(
              context.tracing.start({ screenshots: true, snapshots: true, sources: false }),
              10000,
              "trace-start"
            );
            const page = await withDeadline(context.newPage(), 10000, "page-start");
            page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
            page.on("console", (message) => {
              if (["error", "warning"].includes(message.type()))
                errors.push(`${message.type()}: ${message.text()}`);
            });
            page.on("requestfailed", (request) =>
              errors.push(`request: ${request.url()} ${request.failure()?.errorText}`)
            );
            page.on("response", (response) => {
              if (response.status() >= 400)
                errors.push(`HTTP ${response.status()}: ${response.url()}`);
            });
            await withDeadline(
              context.route("**/*", (route) => {
                const url = new URL(route.request().url());
                if (url.origin === server.origin || ["data:", "blob:"].includes(url.protocol))
                  return route.continue();
                errors.push(`External request: ${url}`);
                return route.abort();
              }),
              5000,
              "route-setup"
            );
            stage = "contract-actions";
            await page.goto(
              `${server.origin}/contract.html${negative ? "?negative=wrapper-event" : ""}`
            );
            await page.locator("#wrapped-input input").waitFor();
            if (negative) {
              await withDeadline(
                assert.rejects(() => check(page, expect), /WRAPPER_EVENT/),
                20000,
                "negative-control"
              );
            } else {
              await withDeadline(check(page, expect), 20000, name);
            }
            assert.deepEqual(
              errors,
              [],
              "Production page must have no console, page, network or HTTP errors"
            );
            results.push({
              engine,
              version: browser.version(),
              contract: name,
              status: "passed",
              negativeControl: negative
            });
          } catch (error) {
            results.push({
              engine,
              version: browser.version(),
              contract: name,
              status: "failed",
              stage,
              error: String(error.stack ?? error),
              errors
            });
          } finally {
            // Persist completed assertions before potentially slow trace/context shutdown.
            await persist();
            await teardown(
              () =>
                context.tracing.stop({ path: join(evidenceDirectory, `${engine}-${name}.zip`) }),
              "trace-teardown",
              engine,
              name
            );
            contextClosed = await teardown(() => context.close(), "context-teardown", engine, name);
          }
          if (!contextClosed) break;
        }
      } catch (error) {
        failures.push({
          engine,
          stage,
          error: String(error.stack ?? error)
        });
        await persist();
      } finally {
        if (browser) await teardown(() => browser.close(), "browser-teardown", engine);
        if (browserServer) {
          const closed = await teardown(() => browserServer.close(), "server-teardown", engine);
          if (!closed) {
            const cleanup = {
              engine,
              descendantCleanup: "unknown-not-inspected",
              status: "failed"
            };
            report.cleanup.push(cleanup);
            const stopped = await teardown(
              async () => {
                Object.assign(cleanup, await terminateOwnedChild(browserServer.process()));
              },
              "owned-direct-child-kill",
              engine
            );
            cleanup.status = stopped ? "direct-child-exit-observed" : "failed";
          }
        }
        await persist();
      }
    }
  } finally {
    await teardown(() => server.close(), "http-teardown");
  }
  const passed = isRuntimeComplete(results, failures);
  report.status = passed ? "passed" : "failed";
  report.browserRuntimeTested = passed;
  await persist();
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , fixture, output] = process.argv;
  if (!fixture || !output)
    throw new Error(
      "Usage: node scripts/framework-runtime.mjs <packed-fixture-directory> <runtime-evidence-directory>"
    );
  const result = await runReactRuntime(resolve(fixture), resolve(output));
  console.log(
    `${result.status}: ${result.results.filter((entry) => entry.status === "passed").length}/${result.results.length} packed React runtime checks`
  );
  if (result.status !== "passed") process.exitCode = 1;
}
