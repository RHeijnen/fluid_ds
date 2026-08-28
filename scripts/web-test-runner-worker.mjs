import { createRequire } from "node:module";
import { resolve } from "node:path";
import { createLifecycle, serializedTestFailures } from "./web-test-runner-lifecycle.mjs";

const requireFromPackage = createRequire(resolve(process.cwd(), "package.json"));
const { startTestRunner } = requireFromPackage("@web/test-runner");
let runner;
let ipcFailed = false;
let snapshotId = 0;
const pendingSnapshots = new Map();
function send(type, detail) {
  if (ipcFailed || !process.connected) return;
  const failed = (error) => {
    if (!error || ipcFailed) return;
    ipcFailed = true;
    console.error("Fluid WTR worker IPC failed:", error.message);
    process.exitCode = 1;
    if (process.connected) process.disconnect();
    void runner?.stop(error).catch((failure) => console.error(failure));
  };
  try {
    process.send({ type, detail, at: new Date().toISOString() }, failed);
  } catch (error) {
    failed(error);
  }
}
const lifecycle = createLifecycle({
  record: send,
  complete(result) {
    send("complete", result);
    process.exitCode = result.passed ? 0 : 1;
    if (process.connected) process.disconnect();
  }
});
lifecycle.captureProcesses = () =>
  new Promise((resolveSnapshot) => {
    const id = ++snapshotId;
    pendingSnapshots.set(id, resolveSnapshot);
    send("snapshot-request", { id });
  });

function abort(error) {
  lifecycle.fail("worker", error);
  lifecycle.beginShutdown("worker-error");
  void runner?.stop(error).catch((failure) => lifecycle.fail("runner.stop", failure));
}
process.on("uncaughtException", abort);
process.on("unhandledRejection", abort);
process.on("message", (message) => {
  if (message?.type === "snapshot-recorded") {
    pendingSnapshots.get(message.id)?.();
    pendingSnapshots.delete(message.id);
  }
  if (message?.type === "shutdown-timeout") {
    lifecycle.fail(
      "shutdown-deadline",
      "Shutdown exceeded 30000ms; assertion success is not run success"
    );
    lifecycle.closeOwnedConnections();
    void runner?.stop().catch((error) => lifecycle.fail("runner.stop", error));
  }
  if (message?.type === "abort") abort(new Error("Test supervisor interrupted"));
});

try {
  runner = await startTestRunner({
    autoExitProcess: false,
    argv: process.argv.slice(2),
    config: { plugins: [lifecycle.plugin] }
  });
  if (!runner) throw new Error("Test runner failed to start");
  if (lifecycle.launchers.size !== runner.browsers.length) {
    throw new Error("Every browser launcher must use fluidPlaywrightLauncher for supervised runs");
  }
  const originalStop = runner.stop.bind(runner);
  runner.stop = async (error) => {
    if (error) lifecycle.fail("runner.stop", error);
    lifecycle.beginShutdown("runner.stop");
    return originalStop(error);
  };
  runner.on("finished", (passed) => {
    // @web/test-runner-mocha 0.9.0 can report a forbidden pending test as a
    // successful skip even though it retains Mocha's error in testResults.
    // Reconcile the public results before accepting its aggregate boolean.
    const failures = serializedTestFailures(runner.sessions.all());
    for (const failure of failures) {
      lifecycle.fail("test-results", failure);
      console.error(`Fluid WTR test result failure: ${failure}`);
    }
    lifecycle.assertionsPassed = passed && failures.length === 0;
    send("assertions-finished", { passed: lifecycle.assertionsPassed });
    lifecycle.beginShutdown("assertions-finished");
  });
  runner.on("stopped", (passed) => {
    lifecycle.stoppedPassed = passed;
    send("runner-stopped", { passed });
    lifecycle.maybeComplete();
  });
  // The fixture-only entry is not exposed through environment configuration.
  send("worker-ready", {});
} catch (error) {
  abort(error);
}
