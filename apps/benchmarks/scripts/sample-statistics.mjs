function finiteSample(value, name, index) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${name} sample at index ${index}`);
  }
  return value;
}

function percentile(sorted, proportion) {
  const rank = Math.max(0, Math.ceil(proportion * sorted.length) - 1);
  return sorted[rank];
}

export function summarizeSamples(samples, expectedCount, name = "measurement") {
  if (!Array.isArray(samples) || samples.length !== expectedCount || expectedCount <= 0) {
    throw new Error(
      `Missing ${name} samples: expected ${expectedCount}, received ${samples?.length ?? 0}`
    );
  }
  const sorted = samples
    .map((value, index) => finiteSample(value, name, index))
    .sort((a, b) => a - b);
  const mean = sorted.reduce((total, value) => total + value, 0) / sorted.length;
  const variance = sorted.reduce((total, value) => total + (value - mean) ** 2, 0) / sorted.length;
  const standardDeviation = Math.sqrt(variance);
  return {
    count: sorted.length,
    minimum: sorted[0],
    median:
      sorted.length % 2
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2,
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    maximum: sorted.at(-1),
    mean,
    variance,
    standardDeviation,
    coefficientOfVariation: mean === 0 ? 0 : standardDeviation / mean
  };
}

export function summarizeRuns(runs, metricNames, expectedCount) {
  if (!Array.isArray(runs) || runs.length !== expectedCount) {
    throw new Error(
      `Missing benchmark runs: expected ${expectedCount}, received ${runs?.length ?? 0}`
    );
  }
  return Object.fromEntries(
    metricNames.map((metric) => [
      metric,
      summarizeSamples(
        runs.map((run) => run?.[metric]),
        expectedCount,
        metric
      )
    ])
  );
}
