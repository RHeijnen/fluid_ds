import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { connect } from "node:net";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { SHUTDOWN_TIMEOUT } from "./run-web-tests.mjs";
import { collectOwned, processSnapshot } from "./wtr-process-tree.mjs";

const root = fileURLToPath(new URL("../quality/evidence/wtr-lifecycle-tests/", import.meta.url));
const run = new Date().toISOString().replaceAll(/[:.]/g, "-");

test("production shutdown deadline is thirty seconds, separate from assertion timeouts", () => {
  assert.equal(SHUTDOWN_TIMEOUT, 30000);
});

test("process ownership ignores unrelated names and PID reuse", () => {
  const known = new Map();
  const rootProcess = { pid: 10, parent: 1, birth: "100", clock: "windows-ticks", name: "node" };
  const child = { pid: 11, parent: 10, birth: "200", clock: "windows-ticks", name: "webkit" };
  const unrelated = { pid: 12, parent: 1, birth: "300", clock: "windows-ticks", name: "webkit" };
  const options = {
    root: {
      pid: 10,
      parentPid: 1,
      clock: "windows-ticks",
      notBefore: "99",
      notAfter: "101",
      canSeed: true
    }
  };
  assert.deepEqual(collectOwned([rootProcess, child, unrelated], 10, known, options), [
    rootProcess,
    child
  ]);
  assert.deepEqual(collectOwned([{ ...child, birth: "400" }, unrelated], 10, known, options), []);
});

for (const mode of [
  "healthy",
  "hang",
  "hang-after-close",
  "reject",
  "assertion-fail",
  "server-hang",
  "inventory-fail",
  "ipc-disconnect",
  "failure-message",
  "ambiguous-ownership"
]) {
  test(
    `supervisor ${mode}: truthful exit and released owned resources`,
    { timeout: 30000 },
    async () => {
      const directory = join(root, run, mode);
      await mkdir(directory, { recursive: true });
      const child = spawn(
        process.execPath,
        [
          fileURLToPath(new URL("./fixtures/wtr-supervisor-cli.mjs", import.meta.url)),
          mode,
          directory
        ],
        {
          stdio: ["ignore", "pipe", "pipe"],
          windowsHide: true
        }
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
      assert.equal(code, mode === "healthy" ? 0 : 1, output);
      const files = await readdir(directory);
      assert.equal(files.length, 1, output);
      const evidence = JSON.parse(await readFile(join(directory, files[0]), "utf8"));
      assert.equal(evidence.status, mode === "healthy" ? "passed" : "failed");
      assert.deepEqual(evidence.remainingProcesses, mode === "inventory-fail" ? null : []);
      const resources = evidence.events.find((event) => event.type === "fixture-resources")?.detail;
      assert.ok(resources, output);
      if (mode === "ambiguous-ownership") {
        assert.equal(
          evidence.completion.passed,
          true,
          "assertions and normal teardown still passed"
        );
        assert.equal(evidence.cleanupVerification, "unknown-ownership");
        assert.ok(evidence.ownershipUncertainties.some((entry) => entry.pid === 2147483646));
        assert.equal(
          evidence.observedProcesses.some((entry) => entry.pid === 2147483646),
          false
        );
        assert.equal(
          evidence.cleanup.some((entry) => entry.pid === 2147483646),
          false
        );
      }
      if (mode === "inventory-fail") {
        assert.equal(evidence.cleanupVerification, "unknown");
        assert.ok(
          evidence.events.some(
            (event) =>
              event.type === "shutdown-deadline" &&
              event.detail.reason === "process-inventory-error"
          )
        );
      } else
        assert.ok(
          evidence.observedProcesses.some((entry) => entry.pid === resources.sidecarPid),
          "sidecar ancestry must be observed"
        );
      const processes = await processSnapshot();
      if (mode === "inventory-fail")
        assert.equal(
          processes.some((entry) => entry.pid === resources.workerPid),
          false
        );
      assert.equal(
        processes.some((entry) =>
          evidence.observedProcesses.some(
            (owned) => owned.pid === entry.pid && owned.birth === entry.birth
          )
        ),
        false
      );
      const socket = connect(resources.port, "127.0.0.1");
      const [error] = await once(socket, "error");
      socket.destroy();
      assert.equal(error.code, "ECONNREFUSED");
      if (mode === "reject")
        assert.ok(
          evidence.events.some(
            (event) =>
              event.type === "failure" &&
              event.detail.message.includes("Injected launcher.stop rejection")
          )
        );
      if (mode === "failure-message")
        assert.ok(
          evidence.events.some(
            (event) =>
              event.type === "shutdown-deadline" && event.detail.reason === "worker-failure"
          )
        );
      if (mode.includes("hang"))
        assert.ok(evidence.events.some((event) => event.type === "shutdown-failed"));
      if (mode === "healthy") {
        assert.equal(evidence.completion.serverClosed, true);
        assert.deepEqual(Object.values(evidence.completion.launchers), ["stopped"]);
        assert.equal(evidence.cleanup.length, 0);
      }
    }
  );
}
