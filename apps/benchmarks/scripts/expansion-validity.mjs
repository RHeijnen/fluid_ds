export const EXPANSION_CASES = [
  "table",
  "chart",
  "scheduler",
  "editor",
  "parser",
  "map",
  "node-graph"
];

function finiteNonNegative(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number`);
  }
}

function retainedCount(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 20) {
    throw new Error(`${label} must be an integer from 0 through 20`);
  }
}

export function validateExpansionReport(report, expectedSamples) {
  if (!Number.isInteger(expectedSamples) || expectedSamples < 3) {
    throw new Error("expectedSamples must be an integer of at least 3");
  }
  const actual = Object.keys(report.cases ?? {}).sort();
  const expected = [...EXPANSION_CASES].sort();
  if (actual.join("\0") !== expected.join("\0")) {
    throw new Error(`Expansion cases must be exactly: ${expected.join(", ")}`);
  }
  for (const name of EXPANSION_CASES) {
    const item = report.cases[name];
    if (!Array.isArray(item.samples) || item.samples.length !== expectedSamples) {
      throw new Error(`${name} must retain exactly ${expectedSamples} samples`);
    }
    for (const [index, sample] of item.samples.entries()) {
      finiteNonNegative(
        sample.initialRenderMilliseconds,
        `${name}[${index}].initialRenderMilliseconds`
      );
      finiteNonNegative(sample.updateMilliseconds, `${name}[${index}].updateMilliseconds`);
      finiteNonNegative(sample.reconnectMilliseconds, `${name}[${index}].reconnectMilliseconds`);
      finiteNonNegative(sample.heapBeforeBytes, `${name}[${index}].heapBeforeBytes`);
      finiteNonNegative(sample.heapAfterBytes, `${name}[${index}].heapAfterBytes`);
      finiteNonNegative(sample.heapPreparedBytes, `${name}[${index}].heapPreparedBytes`);
      finiteNonNegative(
        sample.lifecycleWarmupHeapGrowthBytes,
        `${name}[${index}].lifecycleWarmupHeapGrowthBytes`
      );
      finiteNonNegative(
        sample.lifecycleHeapGrowthBytes,
        `${name}[${index}].lifecycleHeapGrowthBytes`
      );
      if (
        sample.lifecycleWarmupHeapGrowthBytes !==
        Math.max(0, sample.heapBeforeBytes - sample.heapPreparedBytes)
      ) {
        throw new Error(`${name}[${index}] warm-up heap growth does not match raw samples`);
      }
      if (
        sample.lifecycleHeapGrowthBytes !==
        Math.max(0, sample.heapAfterBytes - sample.heapBeforeBytes)
      ) {
        throw new Error(`${name}[${index}] lifecycle heap growth does not match raw samples`);
      }
      finiteNonNegative(
        sample.heapCalibrationGrowthBytes,
        `${name}[${index}].heapCalibrationGrowthBytes`
      );
      if (sample.heapCalibrationGrowthBytes < 1_000_000) {
        throw new Error(`${name}[${index}] heap calibration did not retain a visible allocation`);
      }
      if (sample.renderedMarker !== name) {
        throw new Error(`${name}[${index}] did not retain its rendered marker`);
      }
      if (sample.reconnectCycles !== 20) {
        throw new Error(`${name}[${index}] must execute exactly 20 reconnect cycles`);
      }
      retainedCount(sample.retainedWarmupInstances, `${name}[${index}].retainedWarmupInstances`);
      retainedCount(
        sample.retainedLifecycleInstances,
        `${name}[${index}].retainedLifecycleInstances`
      );
      retainedCount(
        sample.retainedLifecycleInstancesAfterDelay,
        `${name}[${index}].retainedLifecycleInstancesAfterDelay`
      );
      retainedCount(
        sample.retainedLibraryControlInstances,
        `${name}[${index}].retainedLibraryControlInstances`
      );
      if (name !== "map" && sample.retainedLibraryControlInstances !== 0) {
        throw new Error(`${name}[${index}] cannot report a Map-only library control`);
      }
    }
  }
  return report;
}
