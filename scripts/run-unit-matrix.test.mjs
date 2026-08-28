import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runOwnedNode } from "./cem/owned-node.mjs";
import { unitMatrixCommands } from "./run-unit-matrix.mjs";

test("matrix arguments select every catalog package once and drain failures serially", () => {
  const catalog = {
    components: [{ package: "@fluid-ds/z" }, { package: "@fluid-ds/a" }, { package: "@fluid-ds/z" }]
  };
  const matrix = unitMatrixCommands(catalog, ["chromium", "firefox", "webkit"]);
  assert.deepEqual(
    matrix.map((entry) => entry.browser),
    ["chromium", "firefox", "webkit"]
  );
  for (const entry of matrix) {
    assert.deepEqual(entry.packages, ["@fluid-ds/a", "@fluid-ds/z"]);
    assert.deepEqual(entry.args, [
      "pnpm",
      "--workspace-concurrency=1",
      "--no-bail",
      "--filter",
      "@fluid-ds/a",
      "--filter",
      "@fluid-ds/z",
      "test"
    ]);
  }
});

test("empty, invalid or duplicated engines and invalid package filters fail closed", () => {
  const catalog = { components: [{ package: "@fluid-ds/components" }] };
  for (const browsers of [[], ["chrome"], ["chromium", "chromium"]])
    assert.throws(() => unitMatrixCommands(catalog, browsers));
  for (const components of [[], [{ package: "--filter=*" }], [{ package: "@fluid-ds/x && other" }]])
    assert.throws(() => unitMatrixCommands({ components }, ["chromium"]));
});

test("the current matrix contains all fourteen published component packages", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../quality/component-quality.json", import.meta.url), "utf8")
  );
  const [entry] = unitMatrixCommands(catalog, ["webkit"]);
  assert.equal(entry.packages.length, catalog.summary.packages);
  assert.equal(entry.packages.length, 14);
});

const repository = dirname(dirname(fileURLToPath(import.meta.url)));
const execution = new Date().toISOString().replaceAll(/[:.]/g, "-");

async function nativeRunnerFixture(kind, failFirst) {
  const directory = join(repository, "quality/evidence/unit-matrix-tests", execution, kind);
  await mkdir(join(directory, "scripts"), { recursive: true });
  await mkdir(join(directory, "quality"), { recursive: true });
  const manifest = JSON.parse(await readFile(join(repository, "package.json"), "utf8"));
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      packageManager: manifest.packageManager
    })
  );
  await writeFile(join(directory, "pnpm-workspace.yaml"), "packages:\n  - 'packages/*'\n");
  const names = ["components", "editor", "markdown"];
  const catalog = { components: names.map((name) => ({ package: `@fluid-ds/${name}` })) };
  await writeFile(join(directory, "quality/component-quality.json"), JSON.stringify(catalog));
  for (const [index, name] of names.entries()) {
    const packageDirectory = join(directory, "packages", `${index}-${name}`);
    await mkdir(packageDirectory, { recursive: true });
    await writeFile(
      join(packageDirectory, "package.json"),
      JSON.stringify({
        name: `@fluid-ds/${name}`,
        version: "0.0.0",
        type: "module",
        scripts: { test: "node task.mjs" }
      })
    );
    await writeFile(
      join(packageDirectory, "task.mjs"),
      `
      import { appendFileSync } from "node:fs";
      const record = (event) => appendFileSync(process.env.MATRIX_FIXTURE_LOG,
        JSON.stringify({ event, package: ${JSON.stringify(name)}, engine: process.env.FLUID_BROWSERS ?? "coverage", pid: process.pid }) + "\\n");
      record("start");
      await new Promise(resolve => setTimeout(resolve, ${index === 1 ? 700 : 20}));
      record("end");
      process.exitCode = ${failFirst && index === 0 ? 7 : 0};
    `
    );
  }
  const runner = kind === "coverage-failure" ? "run-coverage.mjs" : "run-unit-matrix.mjs";
  await writeFile(
    join(directory, "scripts", runner),
    await readFile(join(repository, "scripts", runner))
  );
  await writeFile(
    join(directory, "scripts/resolve-test-browsers.mjs"),
    await readFile(join(repository, "scripts/resolve-test-browsers.mjs"))
  );
  // A failed coverage command must not advance to inventory certification.
  await writeFile(
    join(directory, "scripts/coverage-inventory.mjs"),
    'export async function checkCoverageInventories() { throw new Error("FIXTURE_INVENTORY_MUST_NOT_RUN"); }'
  );
  const log = join(directory, "task-events.jsonl");
  const env = {
    ...process.env,
    CI: "true",
    COREPACK_ENABLE_NETWORK: "0",
    PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false",
    MATRIX_FIXTURE_LOG: log
  };
  if (kind === "coverage-failure") delete env.FLUID_BROWSERS;
  else env.FLUID_BROWSERS = failFirst ? "chromium,firefox" : "chromium";
  const result = await runOwnedNode([join(directory, "scripts", runner)], {
    cwd: directory,
    env,
    timeoutMs: 20000
  });
  await writeFile(join(directory, "output.log"), result.stdout + result.stderr);
  await writeFile(join(directory, "result.json"), JSON.stringify(result, null, 2));
  assert.equal(result.directChildExitObserved, true, JSON.stringify(result));
  assert.equal(result.terminationRequested, false, JSON.stringify(result));
  assert.equal(result.signal, null, JSON.stringify(result));
  const events = (await readFile(log, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  return { result, events, names };
}

function assertDrained(events, names, engines) {
  const expected = engines.flatMap((engine) =>
    names.flatMap((name) => [
      { engine, package: name, event: "start" },
      { engine, package: name, event: "end" }
    ])
  );
  assert.deepEqual(
    events.map(({ engine, package: name, event }) => ({ engine, package: name, event })),
    expected,
    "every selected task must finish once, serially, before the next engine begins"
  );
}

test(
  "actual pinned pnpm drains both engine phases after failure without hiding the nonzero result",
  { timeout: 30000 },
  async () => {
    const { result, events, names } = await nativeRunnerFixture("matrix-failure", true);
    assert.equal(result.exitCode, 1, result.stdout + result.stderr);
    assertDrained(events, names, ["chromium", "firefox"]);
    const report = JSON.parse(result.stdout.slice(result.stdout.lastIndexOf('{\n  "unitMatrix"')));
    assert.deepEqual(
      report.unitMatrix.map(({ status }) => status),
      ["failed", "failed"]
    );
  }
);

test(
  "actual pinned pnpm drains the coverage package queue before returning failure",
  { timeout: 30000 },
  async () => {
    const { result, events, names } = await nativeRunnerFixture("coverage-failure", true);
    assert.notEqual(result.exitCode, 0, result.stdout + result.stderr);
    assert.notEqual(result.exitCode, null, result.stdout + result.stderr);
    assert.doesNotMatch(result.stdout + result.stderr, /FIXTURE_INVENTORY_MUST_NOT_RUN/);
    assertDrained(events, names, ["coverage"]);
  }
);

test(
  "actual pinned pnpm keeps an entirely successful matrix successful",
  { timeout: 30000 },
  async () => {
    const { result, events, names } = await nativeRunnerFixture("matrix-success", false);
    assert.equal(result.exitCode, 0, result.stdout + result.stderr);
    assertDrained(events, names, ["chromium"]);
  }
);
