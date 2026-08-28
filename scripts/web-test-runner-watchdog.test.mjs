import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "node:net";
import { processSnapshot, terminateOwned } from "./wtr-process-tree.mjs";
import { STARTUP_TIMEOUT, PROCESS_OPERATION_TIMEOUT, SHUTDOWN_TIMEOUT } from "./run-web-tests.mjs";

test("startup and operation deadlines are independent of the unchanged shutdown budget", () => {
  assert.equal(STARTUP_TIMEOUT, 30000);
  assert.equal(PROCESS_OPERATION_TIMEOUT, 10000);
  assert.equal(SHUTDOWN_TIMEOUT, 30000);
});
test("an already canceled inventory cannot launch a native probe", async () => {
  const controller = new AbortController();
  const reason = new Error("Canceled inventory");
  controller.abort(reason);
  await assert.rejects(processSnapshot({ signal: controller.signal }), (error) => error === reason);
});
test("an already canceled cleanup cannot dispatch native termination", async () => {
  const controller = new AbortController();
  const reason = new Error("Canceled cleanup");
  controller.abort(reason);
  await assert.rejects(
    terminateOwned(new Map(), {}, { signal: controller.signal }),
    (error) => error === reason
  );
});

const root = fileURLToPath(new URL("../quality/evidence/wtr-watchdog-tests/", import.meta.url));
const run = new Date().toISOString().replaceAll(/[:.]/g, "-");
for (const mode of [
  "startup-never-ready",
  "hanging-config",
  "inventory-never-settles",
  "inventory-late-result",
  "cleanup-never-settles",
  "cleanup-late-result",
  "finish-cleanup-race",
  "clock-late-result"
]) {
  test(
    `watchdog ${mode}: bounded failure without invented cleanup`,
    { timeout: 30000 },
    async () => {
      const directory = join(root, run, mode);
      await mkdir(directory, { recursive: true });
      const child = spawn(
        process.execPath,
        [
          fileURLToPath(new URL("./fixtures/wtr-watchdog-cli.mjs", import.meta.url)),
          mode,
          directory
        ],
        { stdio: ["ignore", "pipe", "pipe"], windowsHide: true }
      );
      let output = "";
      child.stdout.on("data", (data) => {
        output += data;
      });
      child.stderr.on("data", (data) => {
        output += data;
      });
      const [code, signal] = await once(child, "exit");
      assert.equal(signal, null, output);
      assert.equal(code, 1, output);
      const files = (await readdir(directory)).filter((name) => name !== "watchdog-result.json");
      assert.equal(files.length, 1, output);
      const evidence = JSON.parse(await readFile(join(directory, files[0]), "utf8"));
      const result = JSON.parse(await readFile(join(directory, "watchdog-result.json"), "utf8"));
      assert.equal(evidence.status, "failed");
      assert.ok(
        result.elapsed < 12000,
        `Supervisor exceeded bounded fixture budget: ${result.elapsed}`
      );
      assert.equal(
        result.evidenceUnchanged,
        true,
        "late probes must not mutate finalized evidence"
      );
      const resources = evidence.events.find((event) => event.type === "fixture-resources")?.detail;
      const workerPid =
        resources?.workerPid ??
        evidence.events.find((event) => event.type === "fixture-config-entered")?.detail.workerPid;
      assert.ok(workerPid, "the actual worker/config must execute");
      assert.equal(
        (await processSnapshot()).some((entry) => entry.pid === workerPid),
        false
      );
      if (resources?.port) {
        const socket = connect(resources.port, "127.0.0.1");
        const [error] = await once(socket, "error");
        socket.destroy();
        assert.equal(error.code, "ECONNREFUSED");
      }
      if (mode.startsWith("inventory-") || mode === "clock-late-result") {
        assert.equal(evidence.cleanupVerification, "unknown");
        assert.equal(evidence.remainingProcesses, null);
        assert.equal(
          result.stats.terminateCalls,
          0,
          "unknown inventory must use only the owned worker handle"
        );
        assert.ok(
          evidence.events.some(
            (event) =>
              event.type === "operation-timeout" && event.detail.phase === "process-inventory"
          )
        );
      } else if (mode.startsWith("cleanup-")) {
        assert.equal(evidence.cleanupVerification, "unknown");
        assert.equal(result.stats.abortObserved, true);
        assert.equal(result.stats.lateDispatches, 0);
        assert.ok(
          evidence.events.some(
            (event) =>
              event.type === "operation-timeout" && event.detail.phase === "process-cleanup"
          )
        );
      } else if (mode === "finish-cleanup-race") {
        assert.equal(
          result.stats.workerObserved,
          true,
          "the fixture must observe the real worker before exit"
        );
        const deadline = evidence.events.find((event) => event.type === "shutdown-failed");
        assert.ok(deadline, "the held post-exit inventory must trigger the shutdown deadline");
        assert.ok(result.stats.raceEnteredAt !== null);
        assert.ok(result.stats.raceEnteredAt < Date.parse(deadline.at));
        assert.ok(Date.parse(deadline.at) < result.stats.raceReleasedAt);
        assert.equal(evidence.completion.passed, true);
        assert.equal(
          result.terminateCallsAtFinish,
          1,
          "cleanup must finish before the supervisor result"
        );
        assert.equal(result.stats.terminateCalls, 1);
        assert.ok(evidence.events.some((event) => event.type === "shutdown-failed"));
      } else {
        assert.ok(evidence.events.some((event) => event.type === "startup-failed"));
      }
    }
  );
}
