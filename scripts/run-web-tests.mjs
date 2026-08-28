import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectOwned,
  processBirthBoundary,
  processSnapshot,
  terminateOwned
} from "./wtr-process-tree.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const SHUTDOWN_TIMEOUT = 30000;
export const STARTUP_TIMEOUT = 30000;
export const PROCESS_OPERATION_TIMEOUT = 10000;

export async function supervise({
  worker = join(here, "web-test-runner-worker.mjs"),
  args = [],
  cwd = process.cwd(),
  artifactDir,
  shutdownTimeout = SHUTDOWN_TIMEOUT,
  startupTimeout = STARTUP_TIMEOUT,
  inventoryTimeout = PROCESS_OPERATION_TIMEOUT,
  cleanupTimeout = PROCESS_OPERATION_TIMEOUT,
  processOperations = { snapshot: processSnapshot, terminate: terminateOwned }
} = {}) {
  const startedAt = new Date().toISOString();
  const evidence = {
    startedAt,
    cwd,
    worker,
    shutdownTimeout,
    startupTimeout,
    inventoryTimeout,
    cleanupTimeout,
    events: [],
    observedProcesses: [],
    cleanup: [],
    status: "running"
  };
  const directory = artifactDir ?? resolve(here, "../quality/evidence/wtr-lifecycle");
  await mkdir(directory, { recursive: true });
  const artifact = join(directory, `${startedAt.replaceAll(/[:.]/g, "-")}-${process.pid}.json`);
  const birthBoundary = processOperations.birthBoundary ?? processBirthBoundary;
  const beforeSpawn = await birthBoundary();
  const child = spawn(process.execPath, [worker, ...args], {
    cwd,
    env: process.env,
    stdio: ["inherit", "inherit", "inherit", "ipc"],
    windowsHide: true
  });
  const known = new Map();
  const ownershipUncertainties = new Map();
  const scope = {
    pid: child.pid,
    parentPid: process.pid,
    clock: beforeSpawn.clock,
    notBefore: beforeSpawn.birth,
    notAfter: undefined
  };
  const spawnWindow = birthBoundary()
    .then((afterSpawn) => {
      if (finished) return;
      if (afterSpawn.clock !== scope.clock)
        throw new Error("Worker birth clocks changed during spawn");
      scope.notAfter = (BigInt(afterSpawn.birth) + BigInt(afterSpawn.resolution) - 1n).toString();
    })
    .catch((error) => ({ error }));
  let deadline,
    startupDeadline,
    poll,
    exit,
    completion,
    failing = false,
    cleaning = false,
    cleaningDone = false,
    finished = false,
    inventoryUnavailable,
    cleanupUnknown = false,
    snapshotPending;
  const event = (type, detail = {}) =>
    evidence.events.push({ at: new Date().toISOString(), type, detail });
  function bounded(phase, milliseconds, operation) {
    const controller = new AbortController();
    return new Promise((resolveOperation, rejectOperation) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const error = new Error(`${phase} exceeded ${milliseconds}ms`);
        error.code = "FLUID_OPERATION_TIMEOUT";
        controller.abort(error);
        if (!finished) event("operation-timeout", { phase, milliseconds });
        rejectOperation(error);
      }, milliseconds);
      Promise.resolve()
        .then(() => operation(controller.signal))
        .then(
          (value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolveOperation(value);
          },
          (error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            rejectOperation(error);
          }
        );
    });
  }
  const snapshot = () =>
    (snapshotPending ??= Promise.resolve()
      .then(() => {
        if (finished) throw new Error("Supervisor already finalized");
        if (inventoryUnavailable) throw inventoryUnavailable;
        return bounded("process-inventory", inventoryTimeout, async (signal) => {
          const [rows, boundary] = await Promise.all([
            processOperations.snapshot({ workerPid: child.pid, signal }),
            spawnWindow
          ]);
          signal.throwIfAborted();
          return { rows, boundary };
        });
      })
      .then(({ rows, boundary }) => {
        if (finished) throw new Error("Supervisor already finalized");
        if (boundary?.error) throw boundary.error;
        const uncertain = [];
        const remaining = collectOwned(rows, child.pid, known, {
          root: {
            ...scope,
            canSeed: exit === undefined && child.exitCode === null && child.signalCode === null
          },
          uncertain
        });
        if (!known.has(child.pid))
          uncertain.push({
            pid: child.pid,
            parent: process.pid,
            clock: scope.clock,
            reason: "worker-root-identity-unobserved"
          });
        for (const entry of uncertain) {
          const identity = `${entry.pid}:${entry.clock}:${entry.birth}:${entry.reason}`;
          if (!ownershipUncertainties.has(identity)) {
            ownershipUncertainties.set(identity, entry);
            event("process-ownership-uncertain", entry);
          }
        }
        if (uncertain.length) {
          failing = true;
          beginDeadline("process-ownership-uncertain");
        }
        return remaining;
      })
      .catch((error) => {
        // Once a probe times out, its eventual results cannot establish ownership
        // or authorize later cleanup. Unknown descendant state stays unknown.
        if (error.code === "FLUID_OPERATION_TIMEOUT") inventoryUnavailable = error;
        throw error;
      })
      .finally(() => {
        snapshotPending = undefined;
      }));
  const save = async () => {
    evidence.observedProcesses = [...known.values()];
    evidence.workerOwnershipScope = scope;
    evidence.ownershipUncertainties = [...ownershipUncertainties.values()];
    await writeFile(artifact, JSON.stringify(evidence, null, 2) + "\n");
  };
  let resolveResult;
  const result = new Promise((resolveResultValue) => {
    resolveResult = resolveResultValue;
  });
  async function finish() {
    if (finished || exit === undefined || (!completion && !failing) || (cleaning && !cleaningDone))
      return;
    let remaining;
    try {
      remaining = await snapshot();
      if (finished || (cleaning && !cleaningDone)) return;
      evidence.cleanupVerification = cleanupUnknown
        ? "unknown"
        : ownershipUncertainties.size
          ? "unknown-ownership"
          : "verified-observed-processes";
    } catch (error) {
      if (finished || (cleaning && !cleaningDone)) return;
      failing = true;
      evidence.cleanupVerification = "unknown";
      event("process-inventory-error", { message: error.message });
      if (!cleaningDone) {
        beginDeadline("process-inventory-error");
        return;
      }
      remaining = null;
    }
    if (finished || (cleaning && !cleaningDone)) return;
    if (remaining?.length && !cleaning) return;
    finished = true;
    clearTimeout(deadline);
    clearTimeout(startupDeadline);
    clearInterval(poll);
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    evidence.remainingProcesses = remaining;
    evidence.exit = exit;
    evidence.completion = completion;
    evidence.status =
      !failing && completion?.passed === true && exit.code === 0 && remaining?.length === 0
        ? "passed"
        : "failed";
    evidence.finishedAt = new Date().toISOString();
    try {
      await save();
    } catch (error) {
      evidence.status = "failed";
      console.error("Fluid WTR lifecycle evidence write failed:", error.message);
    }
    console.log(`Fluid WTR lifecycle ${evidence.status}: ${artifact}`);
    resolveResult({ code: evidence.status === "passed" ? 0 : 1, artifact, evidence });
  }
  async function timeout(reason) {
    if (finished || cleaning) return;
    failing = true;
    cleaning = true;
    clearTimeout(startupDeadline);
    clearInterval(poll);
    event("shutdown-failed", { reason });
    let inventoryReady = false;
    await snapshot()
      .then(() => {
        inventoryReady = true;
      })
      .catch((error) => {
        cleanupUnknown = true;
        event("process-inventory-error", { message: error.message });
      });
    sendToWorker({ type: "shutdown-timeout" });
    // A short grace lets the worker close its owned HTTP sockets and flush diagnostics.
    await new Promise((resolveGrace) => setTimeout(resolveGrace, 250));
    if (inventoryReady) {
      evidence.cleanup = await bounded("process-cleanup", cleanupTimeout, (signal) =>
        processOperations.terminate(known, scope, { signal })
      ).catch((error) => {
        cleanupUnknown = true;
        return [{ error: error.message, verification: "unknown" }];
      });
    } else {
      evidence.cleanup = [{ skipped: "process-inventory-unavailable", verification: "unknown" }];
    }
    if (exit === undefined) {
      // The ChildProcess handle identifies the owned worker even when inventory failed.
      try {
        event("owned-worker-termination", { requested: child.kill("SIGKILL") });
      } catch (error) {
        event("worker-kill-error", { message: error.message });
      }
      await new Promise((resolveExit) => {
        child.once("exit", resolveExit);
        setTimeout(resolveExit, 1000);
      });
    }
    exit ??= { code: null, signal: "worker-exit-unobserved" };
    cleaningDone = true;
    await finish();
  }
  function sendToWorker(message) {
    if (finished || !child.connected) return;
    const failed = (error) => {
      if (!error || finished) return;
      failing = true;
      event("ipc-send-error", { message: error.message });
      beginDeadline("ipc-send-error");
    };
    try {
      child.send(message, failed);
    } catch (error) {
      failed(error);
    }
  }
  function beginDeadline(reason) {
    if (deadline || finished) return;
    event("shutdown-deadline", { reason, milliseconds: shutdownTimeout });
    deadline = setTimeout(() => void timeout(reason), shutdownTimeout);
  }
  function interrupt() {
    failing = true;
    event("interrupted");
    sendToWorker({ type: "abort" });
    beginDeadline("interrupted");
  }
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  event("startup-deadline", { milliseconds: startupTimeout });
  startupDeadline = setTimeout(() => {
    if (finished || cleaning) return;
    event("startup-failed", { milliseconds: startupTimeout });
    void timeout("worker-not-ready");
  }, startupTimeout);
  child.on("message", (message) => {
    if (finished || !message || typeof message.type !== "string") return;
    evidence.events.push(message);
    if (message.type === "worker-ready") clearTimeout(startupDeadline);
    if (message.type === "failure") {
      failing = true;
      beginDeadline("worker-failure");
    }
    if (message.type === "shutdown-start") beginDeadline(message.detail?.reason);
    if (message.type === "complete") {
      completion = message.detail;
      if (!completion?.passed) failing = true;
      beginDeadline("worker-complete-awaiting-exit");
    }
    if (cleaning) return;
    const observed =
      message.type === "snapshot-request"
        ? Promise.resolve(snapshotPending).then(snapshot)
        : snapshot();
    void observed
      .then(() => {
        if (!finished && !cleaning && message.type === "snapshot-request")
          sendToWorker({ type: "snapshot-recorded", id: message.detail?.id });
      })
      .catch((error) => {
        if (finished) return;
        failing = true;
        event("process-inventory-error", { message: error.message });
        beginDeadline("process-inventory-error");
      });
  });
  child.on("error", (error) => {
    if (finished) return;
    failing = true;
    event("spawn-error", { message: error.message });
    if (!child.pid) exit = { code: null, signal: "spawn-error" };
    void timeout("spawn-error");
  });
  child.on("disconnect", () => {
    if (finished) return;
    if (!completion) {
      failing = true;
      beginDeadline("ipc-disconnected-before-completion");
    }
  });
  child.on("exit", (code, signal) => {
    if (finished) return;
    exit = { code, signal };
    if (!completion || code !== 0) failing = true;
    beginDeadline("worker-exited");
    void finish();
  });
  const inventoryFailed = (error) => {
    if (finished) return;
    failing = true;
    event("process-inventory-error", { message: error.message });
    beginDeadline("process-inventory-error");
  };
  poll = setInterval(
    () =>
      void snapshot()
        .then(() => finish())
        .catch(inventoryFailed),
    1000
  );
  await snapshot().catch(inventoryFailed);
  if (!finished) {
    try {
      await save();
    } catch (error) {
      event("evidence-write-error", { message: error.message });
      void timeout("evidence-write-error");
    }
  }
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (
    args.some((arg) =>
      ["--watch", "-w", "--manual", "--open", "--help", "-h", "--version"].includes(arg)
    )
  ) {
    const requireFromPackage = createRequire(resolve(process.cwd(), "package.json"));
    const bin = join(dirname(requireFromPackage.resolve("@web/test-runner")), "bin.js");
    const child = spawn(process.execPath, [bin, ...args], { stdio: "inherit", windowsHide: true });
    child.on("exit", (code) => {
      process.exitCode = code ?? 1;
    });
  } else {
    const result = await supervise({ args });
    process.exitCode = result.code;
  }
}
