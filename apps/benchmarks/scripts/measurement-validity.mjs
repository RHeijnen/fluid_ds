/** Missing telemetry is a failed measurement, never zero retained memory. */
export function heapBytes(metrics) {
  const value = metrics?.find((metric) => metric.name === "JSHeapUsedSize")?.value;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid JSHeapUsedSize measurement: expected positive finite bytes");
  }
  return value;
}

export async function heapSampler(cdp) {
  await cdp.send("Performance.enable");
  await cdp.send("HeapProfiler.enable");
  return async () => {
    await cdp.send("HeapProfiler.collectGarbage");
    return heapBytes((await cdp.send("Performance.getMetrics")).metrics);
  };
}

export function performanceMetrics(metrics, requiredNames) {
  if (!Array.isArray(metrics)) throw new Error("Invalid CDP Performance metrics payload");
  return Object.fromEntries(
    requiredNames.map((name) => {
      const value = metrics.find((metric) => metric.name === name)?.value;
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error(`Invalid CDP Performance metric ${name}`);
      }
      return [name, value];
    })
  );
}

export async function performanceSampler(cdp, requiredNames) {
  await cdp.send("Performance.enable");
  return async () =>
    performanceMetrics((await cdp.send("Performance.getMetrics")).metrics, requiredNames);
}

export function metricDeltas(before, after) {
  return Object.fromEntries(
    Object.keys(before).map((name) => {
      if (!(name in after)) throw new Error(`Missing ending CDP Performance metric ${name}`);
      const delta = after[name] - before[name];
      if (!Number.isFinite(delta) || delta < 0)
        throw new Error(`Invalid CDP Performance delta ${name}`);
      return [name, delta];
    })
  );
}

export function validateBudgetMeasurements(results, limits) {
  const failures = [];
  for (const [metric, limit] of Object.entries(limits)) {
    const value = results[metric];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid measurement for ${metric}`);
    }
    if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 0) {
      throw new Error(`Invalid budget for ${metric}`);
    }
    if (value > limit) failures.push(`${metric} is ${value.toFixed(2)}; budget is ${limit}`);
  }
  return failures;
}

/** Page-side precondition and identity check shared by the benchmark and its controls. */
export function captureHydrationNodes(expectedCount) {
  if (customElements.get("fluid-button"))
    throw new Error("Hydration requires an unregistered realm");
  const hosts = [...document.querySelectorAll("fluid-button")];
  if (hosts.length !== expectedCount || expectedCount <= 0)
    throw new Error("Incorrect hydration host count");
  return hosts.map((host) => {
    const root = host.shadowRoot;
    const button = root?.querySelector("button");
    if (!root || !button) throw new Error("Server-rendered native button is absent");
    return { host, root, button };
  });
}

export function assertHydrationNodes(states) {
  if (!states.length) throw new Error("No hydration nodes captured");
  for (const { host, root, button } of states) {
    if (!host.isConnected || host.shadowRoot !== root || root.querySelector("button") !== button) {
      throw new Error("Hydration replaced a server-rendered node");
    }
    if (!(host instanceof customElements.get("fluid-button"))) throw new Error("Host not upgraded");
  }
}
