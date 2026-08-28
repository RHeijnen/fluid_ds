import assert from "node:assert/strict";
import { test } from "node:test";
import {
  heapBytes,
  heapSampler,
  metricDeltas,
  performanceMetrics,
  performanceSampler,
  validateBudgetMeasurements
} from "./measurement-validity.mjs";
import { summarizeRuns, summarizeSamples } from "./sample-statistics.mjs";

test("rejects absent, zero, non-numeric and non-finite heap metrics", () => {
  for (const value of [undefined, 0, -1, NaN, Infinity, "1200"]) {
    assert.throws(() => heapBytes([{ name: "JSHeapUsedSize", value }]), /Invalid JSHeapUsedSize/);
  }
  assert.throws(() => heapBytes([]), /Invalid JSHeapUsedSize/);
  assert.throws(() => heapBytes(undefined), /Invalid JSHeapUsedSize/);
  assert.equal(heapBytes([{ name: "JSHeapUsedSize", value: 1200 }]), 1200);
});
test("enables measurement before sampling and collects garbage for each sample", async () => {
  const calls = [];
  const sample = await heapSampler({
    send: async (method) => {
      calls.push(method);
      return { metrics: [{ name: "JSHeapUsedSize", value: 8000 }] };
    }
  });
  assert.equal(await sample(), 8000);
  assert.equal(await sample(), 8000);
  assert.deepEqual(calls, [
    "Performance.enable",
    "HeapProfiler.enable",
    "HeapProfiler.collectGarbage",
    "Performance.getMetrics",
    "HeapProfiler.collectGarbage",
    "Performance.getMetrics"
  ]);
});

test("budget comparisons fail closed on missing and invalid measurements", () => {
  for (const value of [undefined, NaN, Infinity, -1, "1", false]) {
    assert.throws(
      () => validateBudgetMeasurements({ duration: value }, { duration: 20 }),
      /Invalid measurement/
    );
  }
  assert.throws(
    () => validateBudgetMeasurements({ duration: 1 }, { duration: undefined }),
    /Invalid budget/
  );
  assert.deepEqual(validateBudgetMeasurements({ duration: 0 }, { duration: 20 }), []);
  assert.equal(validateBudgetMeasurements({ duration: 21 }, { duration: 20 }).length, 1);
});

test("CDP performance sampling enables the domain and requires every metric", async () => {
  const calls = [];
  const sample = await performanceSampler(
    {
      send: async (method) => {
        calls.push(method);
        return {
          metrics: [
            { name: "TaskDuration", value: 2 },
            { name: "ScriptDuration", value: 1 }
          ]
        };
      }
    },
    ["TaskDuration", "ScriptDuration"]
  );
  assert.deepEqual(await sample(), { TaskDuration: 2, ScriptDuration: 1 });
  assert.deepEqual(calls, ["Performance.enable", "Performance.getMetrics"]);
  assert.throws(
    () =>
      performanceMetrics([{ name: "TaskDuration", value: 1 }], ["TaskDuration", "LayoutDuration"]),
    /Invalid CDP Performance metric LayoutDuration/
  );
});

test("CDP metric deltas fail closed for missing, negative and non-finite values", () => {
  assert.deepEqual(metricDeltas({ TaskDuration: 1 }, { TaskDuration: 2.5 }), {
    TaskDuration: 1.5
  });
  assert.throws(() => metricDeltas({ TaskDuration: 1 }, {}), /Missing ending/);
  assert.throws(() => metricDeltas({ TaskDuration: 2 }, { TaskDuration: 1 }), /Invalid CDP/);
  assert.throws(() => metricDeltas({ TaskDuration: 1 }, { TaskDuration: Infinity }), /Invalid CDP/);
});

test("summarizes medians, tails and population variance without mutating raw samples", () => {
  const samples = [5, 1, 3, 2, 4];
  const summary = summarizeSamples(samples, 5, "duration");
  assert.deepEqual(samples, [5, 1, 3, 2, 4]);
  assert.equal(summary.median, 3);
  assert.equal(summary.p90, 5);
  assert.equal(summary.p95, 5);
  assert.equal(summary.p99, 5);
  assert.equal(summary.mean, 3);
  assert.equal(summary.variance, 2);
  assert.equal(summary.standardDeviation, Math.sqrt(2));
  assert.equal(summary.coefficientOfVariation, Math.sqrt(2) / 3);
});

test("fails closed for missing, extra, invalid and non-finite samples", () => {
  assert.throws(() => summarizeSamples([1], 2), /Missing measurement samples/);
  assert.throws(() => summarizeSamples([1, 2], 1), /Missing measurement samples/);
  assert.throws(() => summarizeSamples([], 0), /Missing measurement samples/);
  for (const value of [undefined, null, "1", -1, NaN, Infinity]) {
    assert.throws(() => summarizeSamples([value], 1, "duration"), /Invalid duration sample/);
  }
});

test("requires every named metric in every repeated run", () => {
  assert.deepEqual(summarizeRuns([{ duration: 1 }, { duration: 3 }], ["duration"], 2), {
    duration: {
      count: 2,
      minimum: 1,
      median: 2,
      p90: 3,
      p95: 3,
      p99: 3,
      maximum: 3,
      mean: 2,
      variance: 1,
      standardDeviation: 1,
      coefficientOfVariation: 0.5
    }
  });
  assert.throws(
    () => summarizeRuns([{ duration: 1 }, {}], ["duration"], 2),
    /Invalid duration sample/
  );
});
