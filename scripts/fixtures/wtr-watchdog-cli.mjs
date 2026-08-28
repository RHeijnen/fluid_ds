import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { supervise } from "../run-web-tests.mjs";
import { processBirthBoundary, processSnapshot, terminateOwned } from "../wtr-process-tree.mjs";

const mode = process.argv[2];
const directory = process.argv[3];
const started = Date.now();
const emergency = setTimeout(() => {
  console.error("Fixture-only rescue: supervisor did not settle");
  process.exit(72);
}, 20000);
const stats = {
  probes: 0,
  clocks: 0,
  terminateCalls: 0,
  abortObserved: false,
  lateDispatches: 0,
  workerObserved: false,
  raceEnteredAt: null,
  raceReleasedAt: null
};
let observedWorker;
const processOperations = {
  async birthBoundary() {
    const clock = await processBirthBoundary();
    if (++stats.clocks === 2 && mode === "clock-late-result")
      await new Promise((resolve) => setTimeout(resolve, 5500));
    return clock;
  },
  async snapshot({ workerPid }) {
    stats.probes++;
    if (mode === "inventory-never-settles") return new Promise(() => {});
    if (mode === "inventory-late-result") {
      const rows = await processSnapshot();
      await new Promise((resolve) => setTimeout(resolve, 5500));
      return rows;
    }
    const rows = await processSnapshot();
    if (mode === "finish-cleanup-race") {
      observedWorker ??= rows.find((entry) => entry.pid === workerPid);
      stats.workerObserved = observedWorker !== undefined;
      const workerPresent =
        observedWorker &&
        rows.some(
          (entry) =>
            entry.pid === observedWorker.pid &&
            entry.birth === observedWorker.birth &&
            entry.clock === observedWorker.clock
        );
      // Inventory speed differs by platform. Hold the first real post-exit
      // capture, never an assumed ordinal such as "the third snapshot".
      if (observedWorker && !workerPresent && stats.raceEnteredAt === null) {
        stats.raceEnteredAt = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        stats.raceReleasedAt = Date.now();
      }
    }
    return rows;
  },
  async terminate(known, scope, { signal } = {}) {
    stats.terminateCalls++;
    if (mode.startsWith("cleanup-")) {
      signal?.addEventListener(
        "abort",
        () => {
          stats.abortObserved = true;
        },
        { once: true }
      );
      if (mode === "cleanup-never-settles") return new Promise(() => {});
      await new Promise((resolve) => setTimeout(resolve, 3500));
      signal.throwIfAborted();
      stats.lateDispatches++;
    }
    return terminateOwned(known, scope, { signal });
  }
};
const result = await supervise({
  worker: fileURLToPath(
    new URL(
      mode === "hanging-config" ? "../web-test-runner-worker.mjs" : "./wtr-watchdog-worker.mjs",
      import.meta.url
    )
  ),
  cwd: fileURLToPath(new URL("../../packages/components/", import.meta.url)),
  args:
    mode === "hanging-config"
      ? ["--config", fileURLToPath(new URL("./wtr-hanging.config.mjs", import.meta.url))]
      : [mode],
  artifactDir: directory,
  startupTimeout: mode === "hanging-config" ? 6000 : 2000,
  inventoryTimeout: mode === "finish-cleanup-race" ? 5000 : 1500,
  cleanupTimeout: 1500,
  shutdownTimeout: 1000,
  processOperations
});
const elapsed = Date.now() - started;
const finalized = JSON.stringify(result.evidence);
const terminateCallsAtFinish = stats.terminateCalls;
if (mode.endsWith("late-result")) await new Promise((resolve) => setTimeout(resolve, 6000));
if (mode === "finish-cleanup-race") await new Promise((resolve) => setTimeout(resolve, 2000));
await writeFile(
  join(directory, "watchdog-result.json"),
  JSON.stringify(
    {
      elapsed,
      stats,
      terminateCallsAtFinish,
      evidenceUnchanged: finalized === JSON.stringify(result.evidence)
    },
    null,
    2
  )
);
clearTimeout(emergency);
process.exitCode = result.code;
