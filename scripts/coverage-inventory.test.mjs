import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { requireCoverageThresholds } from "./coverage-thresholds.mjs";
import {
  hasLocalRuntime,
  inspectCoverageInventory,
  validateCoverageSummary,
  readCoverageSummary
} from "./coverage-inventory.mjs";

const metrics = (total = 1, covered = total) =>
  Object.fromEntries(
    ["statements", "lines", "functions", "branches"].map((name) => [
      name,
      { total, covered, pct: total === 0 ? 100 : (covered / total) * 100 }
    ])
  );

test("missing or invalid thresholds cannot disable package coverage enforcement", () => {
  assert.throws(() => requireCoverageThresholds("new-package", {}), /Missing/);
  const values = { lines: 95, statements: 95, functions: 90, branches: 85 };
  assert.deepEqual(requireCoverageThresholds("core", { core: values }), values);
  for (const invalid of [undefined, null, NaN, Infinity, -1, 101, "90"]) {
    assert.throws(
      () => requireCoverageThresholds("core", { core: { ...values, functions: invalid } }),
      /Invalid/
    );
  }
});

test("type declarations and forwarding barrels do not masquerade as local executable code", () => {
  assert.equal(
    hasLocalRuntime(
      'import type { Item } from "./item.js"; export interface Props { item: Item }; export * from "./button.js";'
    ),
    false
  );
  assert.equal(hasLocalRuntime("declare const x: string; export type T = typeof x;"), false);
  assert.equal(hasLocalRuntime("export const answer = () => 42;"), true);
  assert.equal(hasLocalRuntime("export class Example {}"), true);
  assert.equal(hasLocalRuntime('import "./hydrate.js";'), true);
});

test("loaded-module totals cannot conceal a completely unexecuted runtime file", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "fluid-coverage-inventory-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src/loaded.ts"), "export function loaded() { return true; }");
  await writeFile(join(root, "src/missing.ts"), "export function missing() { return false; }");
  await writeFile(join(root, "src/index.ts"), 'export * from "./loaded.js";');
  await writeFile(join(root, "src/loaded.test.ts"), "throw new Error('not runtime source');");
  const summary = { total: metrics(), [join(root, "src/loaded.ts")]: metrics() };
  const result = await inspectCoverageInventory(root, summary);
  assert.deepEqual(result.missing, ["src/missing.ts"]);
  assert.deepEqual(result.nonRuntime, ["src/index.ts"]);
  assert.deepEqual(result.measured, ["src/loaded.ts"]);
  const separate = await inspectCoverageInventory(root, summary, {
    separatelyTested: {
      "src/missing.ts": { reason: "Different execution domain", gate: "node gate, not coverage" }
    }
  });
  assert.equal(separate.missing.length, 0);
  assert.equal(separate.separate.length, 1);
  assert.equal(separate.measured.length, 1);
  await assert.rejects(
    inspectCoverageInventory(root, summary, { separatelyTested: { "src/missing.ts": {} } }),
    /Unexplained/
  );
  await assert.rejects(
    inspectCoverageInventory(root, summary, {
      separatelyTested: { "src/gone.ts": { reason: "old", gate: "old" } }
    }),
    /Stale/
  );
});

test("invalid and empty coverage summaries fail instead of claiming a percentage", () => {
  assert.throws(() => validateCoverageSummary({}), /Missing/);
  for (const invalid of [undefined, null, NaN, Infinity, -1, 101, "100"]) {
    const total = metrics();
    total.lines.pct = invalid;
    assert.throws(() => validateCoverageSummary({ total }), /Invalid/);
  }
  const total = metrics();
  total.functions.covered = 2;
  assert.throws(() => validateCoverageSummary({ total }), /Invalid/);
  const inconsistent = metrics();
  inconsistent.lines.covered = 0;
  assert.throws(() => validateCoverageSummary({ total: inconsistent }), /Inconsistent/);
});

test("aggregate coverage counts must reconcile with every measured file", () => {
  for (const metric of ["statements", "lines", "functions", "branches"]) {
    for (const replacement of [
      { total: 2, covered: 1, pct: 50 },
      { total: 1, covered: 0, pct: 0 }
    ]) {
      const total = metrics();
      total[metric] = replacement;
      assert.throws(
        () => validateCoverageSummary({ total, "only-file.ts": metrics() }),
        new RegExp(`Inconsistent aggregate ${metric}`)
      );
    }
  }
  assert.throws(
    () => validateCoverageSummary({ total: metrics(), "uncovered.ts": metrics(1, 0) }),
    /Inconsistent aggregate/
  );
});

test("coverage totals without measured files cannot manufacture a denominator", () => {
  assert.throws(() => validateCoverageSummary({ total: metrics() }), /No measured files/);
  assert.throws(() => validateCoverageSummary({ total: metrics(0) }), /No measured files/);
});

test("aggregate reconciliation accepts mixed coverage and zero-sized file metrics", () => {
  const partial = metrics(3, 1);
  partial.lines.pct = 33.33;
  assert.doesNotThrow(() =>
    validateCoverageSummary({
      total: metrics(5, 3),
      "partial.ts": partial,
      "covered.ts": metrics(2),
      "no-local-branches.ts": metrics(0)
    })
  );
  assert.doesNotThrow(() => validateCoverageSummary({ total: metrics(0), "empty.ts": metrics(0) }));
});

test("registration entries are disclosed as a separate boundary, never silently credited", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "fluid-coverage-registration-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "src/example"), { recursive: true });
  await writeFile(
    join(root, "src/example/define.ts"),
    'customElements.define("fluid-example", Example);'
  );
  const result = await inspectCoverageInventory(root, {
    total: metrics(0),
    [join(root, "src/example/define.ts")]: metrics(0)
  });
  assert.equal(result.required.length, 0);
  assert.equal(result.measured.length, 0);
  assert.equal(result.separate.length, 1);
  assert.equal(result.separate[0].path, "src/example/define.ts");
  assert.match(result.separate[0].gate, /not registration branch coverage/);
});

test("a previous green coverage artifact cannot satisfy a new run", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "fluid-coverage-freshness-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, "coverage-summary.json");
  const summary = { total: metrics(), [join(root, "measured.ts")]: metrics() };
  await writeFile(path, JSON.stringify(summary));
  assert.deepEqual(await readCoverageSummary(path), summary);
  await assert.rejects(readCoverageSummary(path, Date.now() + 1000), /predates this run/);
});
