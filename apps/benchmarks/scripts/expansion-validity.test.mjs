import assert from "node:assert/strict";
import test from "node:test";
import { EXPANSION_CASES, validateExpansionReport } from "./expansion-validity.mjs";

function validSample(name) {
  return {
    initialRenderMilliseconds: 1,
    updateMilliseconds: 1,
    reconnectMilliseconds: 1,
    heapPreparedBytes: 1,
    heapBeforeBytes: 2,
    heapAfterBytes: 3,
    lifecycleWarmupHeapGrowthBytes: 1,
    lifecycleHeapGrowthBytes: 1,
    heapCalibrationGrowthBytes: 8_000_000,
    renderedMarker: name,
    reconnectCycles: 20,
    retainedWarmupInstances: 0,
    retainedLifecycleInstances: 0,
    retainedLifecycleInstancesAfterDelay: 0,
    retainedLibraryControlInstances: 0
  };
}

function validReport() {
  return {
    cases: Object.fromEntries(
      EXPANSION_CASES.map((name) => [
        name,
        { samples: [validSample(name), validSample(name), validSample(name)] }
      ])
    )
  };
}

test("accepts the exact expansion matrix", () => {
  assert.equal(validateExpansionReport(validReport(), 3).cases.table.samples.length, 3);
});

test("rejects a silently omitted case", () => {
  const report = validReport();
  delete report.cases.map;
  assert.throws(() => validateExpansionReport(report, 3), /exactly/);
});

test("rejects a missing retained sample", () => {
  const report = validReport();
  report.cases.editor.samples.pop();
  assert.throws(() => validateExpansionReport(report, 3), /exactly 3 samples/);
});

test("rejects non-finite telemetry", () => {
  const report = validReport();
  report.cases.chart.samples[0].updateMilliseconds = Number.NaN;
  assert.throws(() => validateExpansionReport(report, 3), /finite non-negative/);
});

test("rejects an ineffective heap calibration control", () => {
  const report = validReport();
  report.cases.scheduler.samples[0].heapCalibrationGrowthBytes = 12;
  assert.throws(() => validateExpansionReport(report, 3), /calibration/);
});

test("rejects an incomplete reconnect workload", () => {
  const report = validReport();
  report.cases["node-graph"].samples[0].reconnectCycles = 19;
  assert.throws(() => validateExpansionReport(report, 3), /exactly 20/);
});

test("rejects fractional retained-instance counts", () => {
  const report = validReport();
  report.cases.map.samples[0].retainedLifecycleInstances = 0.5;
  assert.throws(() => validateExpansionReport(report, 3), /integer from 0 through 20/);
});

test("rejects retained-instance counts larger than the measured population", () => {
  const report = validReport();
  report.cases.map.samples[0].retainedLibraryControlInstances = 21;
  assert.throws(() => validateExpansionReport(report, 3), /integer from 0 through 20/);
});

test("rejects heap deltas that do not match the retained raw samples", () => {
  const report = validReport();
  report.cases.chart.samples[0].lifecycleHeapGrowthBytes = 2;
  assert.throws(() => validateExpansionReport(report, 3), /does not match raw samples/);
});

test("rejects Map-only controls on another expansion case", () => {
  const report = validReport();
  report.cases.chart.samples[0].retainedLibraryControlInstances = 1;
  assert.throws(() => validateExpansionReport(report, 3), /Map-only library control/);
});
