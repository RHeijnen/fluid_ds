import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildSeverityDisposition,
  serializeSeverityDisposition,
  validateSeverityDisposition
} from "./severity-disposition.mjs";

function report(overrides = {}) {
  const spec = (engine) => ({
    title: "fluid-example has no browser-level accessibility violations",
    tests: [
      {
        expectedStatus: "passed",
        projectName: engine,
        results: [{ status: "passed", retry: 0, errors: [] }]
      }
    ]
  });
  return {
    config: { projects: [{ name: "chromium" }, { name: "firefox" }, { name: "webkit" }] },
    suites: [{ specs: [spec("chromium"), spec("firefox"), spec("webkit")], suites: [] }],
    stats: { expected: 3, skipped: 0, unexpected: 0, flaky: 0 },
    ...overrides
  };
}

test("retained export is byte-source-bound and current", async () => {
  const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const sourcePath = path.join(
    appDir,
    "evidence/full-accessibility-regression-2026-08-27-final.json"
  );
  const exportPath = path.join(
    appDir,
    "evidence/accessibility-severity-disposition-2026-08-27.json"
  );
  const sourceBytes = await readFile(sourcePath);
  const retainedBytes = await readFile(exportPath, "utf8");
  const retained = JSON.parse(retainedBytes);
  const generated = buildSeverityDisposition(
    JSON.parse(sourceBytes),
    sourceBytes,
    path.basename(sourcePath)
  );
  assert.deepEqual(retained, generated);
  assert.equal(retainedBytes, serializeSeverityDisposition(generated));
  assert.doesNotThrow(() => validateSeverityDisposition(retained));
});

test("exports zero automated severities while retaining the manual AT blocker", () => {
  const result = buildSeverityDisposition(report(), Buffer.from("source"), "report.json");
  assert.equal(result.run.catalogAxeAudits, 3);
  assert.deepEqual(result.run.catalogAxeAuditsByEngine, { chromium: 1, firefox: 1, webkit: 1 });
  assert.deepEqual(result.automatedViolations.byImpact, {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0
  });
  assert.equal(result.manualAssistiveTechnology.covered, false);
  assert.equal(result.manualAssistiveTechnology.disposition, "pending-human-evidence");
  assert.equal(result.manualAssistiveTechnology.inferenceFromAutomatedResultProhibited, true);
  assert.doesNotThrow(() => validateSeverityDisposition(result));
});

test("rejects unexpected, skipped, or flaky final runs", () => {
  for (const field of ["unexpected", "skipped", "flaky"]) {
    assert.throws(
      () =>
        buildSeverityDisposition(
          report({ stats: { ...report().stats, [field]: 1 } }),
          Buffer.from("x"),
          "x.json"
        ),
      /not a clean final run/
    );
  }
});

test("rejects missing engine audit coverage", () => {
  const value = report();
  value.suites[0].specs[2].title = "interaction passes";
  assert.throws(
    () => buildSeverityDisposition(value, Buffer.from("x"), "x.json"),
    /every configured engine/
  );
});

test("rejects malformed or non-passing test records", () => {
  const value = report();
  value.suites[0].specs[0].tests[0].results[0].status = "failed";
  assert.throws(
    () => buildSeverityDisposition(value, Buffer.from("x"), "x.json"),
    /not a clean first-attempt pass/
  );
});

test("validator rejects any attempt to mark manual AT covered", () => {
  const value = buildSeverityDisposition(report(), Buffer.from("source"), "report.json");
  value.manualAssistiveTechnology.covered = true;
  assert.throws(() => validateSeverityDisposition(value), /must remain explicitly pending/);
});
