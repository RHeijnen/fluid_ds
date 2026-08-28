import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { collectOwned, processBirthBoundary, processSnapshot } from "./wtr-process-tree.mjs";

const execute = promisify(execFile);
const path = (name) => fileURLToPath(new URL(name, import.meta.url));
const python = process.platform === "win32" ? "python" : "python3";
const powershell = (script, args = []) => [
  "-NoProfile",
  "-NonInteractive",
  "-WindowStyle",
  "Hidden",
  "-File",
  path(script),
  ...args
];

test("Python pidfd helper mock controls never signal a real process", async () => {
  const { stderr } = await execute(python, ["-B", path("./wtr-terminate-linux.test.py")], {
    windowsHide: true,
    timeout: 10000
  });
  assert.match(stderr, /Ran 4 tests/);
  assert.match(stderr, /OK/);
});

test(
  "Windows bound-handle helper mock controls never signal a real process",
  { skip: process.platform !== "win32" },
  async () => {
    const { stdout } = await execute(
      "powershell.exe",
      powershell("./fixtures/wtr-windows-handle-controls.ps1"),
      { windowsHide: true, timeout: 10000 }
    );
    assert.equal(stdout.match(/PASS mocked Windows handle control:/g)?.length, 4);
  }
);

test(
  "native helper rejects wrong birth then closes only its freshly spawned owned child",
  { skip: !["win32", "linux"].includes(process.platform), timeout: 30000 },
  async (t) => {
    const before = await processBirthBoundary();
    const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      stdio: "ignore",
      windowsHide: true
    });
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, "exit");
        child.kill("SIGKILL");
        await exited;
      }
    });
    await once(child, "spawn");
    const after = await processBirthBoundary();
    const identity = (await processSnapshot()).find((entry) => entry.pid === child.pid);
    assert.ok(identity);
    assert.equal(identity.parent, process.pid);
    assert.equal(child.exitCode, null);
    const uncertain = [];
    assert.deepEqual(
      collectOwned([identity], child.pid, new Map(), {
        root: {
          pid: child.pid,
          parentPid: process.pid,
          clock: before.clock,
          notBefore: before.birth,
          notAfter: (BigInt(after.birth) + BigInt(after.resolution) - 1n).toString(),
          canSeed: true
        },
        uncertain
      }),
      [identity],
      "native spawn clock and process identity must share precision and epoch"
    );
    assert.deepEqual(uncertain, []);
    const invoke = async (birth) => {
      const targets = JSON.stringify([{ pid: child.pid, birth }]);
      const command = process.platform === "win32" ? "powershell.exe" : "python3";
      const args =
        process.platform === "win32"
          ? powershell("./wtr-terminate-windows.ps1", ["-TargetsJson", targets])
          : ["-B", path("./wtr-terminate-linux.py"), targets];
      const { stdout } = await execute(command, args, { windowsHide: true, timeout: 10000 });
      const result = JSON.parse(stdout);
      return Array.isArray(result) ? result[0] : result;
    };
    const wrong = await invoke((BigInt(identity.birth) + 100n).toString());
    assert.equal(wrong.terminationRequested, false);
    assert.equal(wrong.reason, "identity-mismatch");
    assert.equal(child.exitCode, null, "wrong birth must leave the owned child running");
    assert.equal(child.signalCode, null);
    const exited = once(child, "exit");
    const correct = await invoke(identity.birth);
    assert.equal(correct.terminationRequested, true);
    await exited;
    assert.equal(
      (await processSnapshot()).some(
        (entry) => entry.pid === identity.pid && entry.birth === identity.birth
      ),
      false
    );
  }
);
