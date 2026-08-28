import assert from "node:assert/strict";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolveCorepackPnpm, runOwnedNode } from "./owned-node.mjs";

test("normal direct Node exit captures output and does not request termination", async () => {
  const result = await runOwnedNode(
    ["-e", 'process.stdout.write("owned"); process.stderr.write("diagnostic")'],
    { timeoutMs: 5_000 }
  );
  assert.equal(result.status, "passed");
  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout, "owned");
  assert.equal(result.stderr, "diagnostic");
  assert.equal(result.directChildExitObserved, true);
  assert.equal(result.terminationRequested, false);
  assert.equal(result.descendantCleanup, "unknown-not-inspected");
});

test("nonzero exit and spawn failure remain failures instead of being reported as clean cleanup", async () => {
  const failed = await runOwnedNode(["-e", "process.exit(7)"], { timeoutMs: 5_000 });
  assert.equal(failed.status, "failed");
  assert.equal(failed.reason, "nonzero-exit");
  assert.equal(failed.exitCode, 7);
  const missing = await runOwnedNode([], {
    node: join(tmpdir(), "fluid-no-such-node-command.exe"),
    timeoutMs: 5_000
  });
  assert.equal(missing.status, "failed");
  assert.equal(missing.reason, "spawn-error");
  assert.equal(missing.pid, null);
  assert.equal(missing.directChildExitObserved, false);
});

test("deadline stops only the direct child and cannot turn a timed-out command green", async () => {
  const result = await runOwnedNode(["-e", "setInterval(() => {}, 1000)"], {
    timeoutMs: 60,
    teardownMs: 2_000
  });
  assert.equal(result.status, "failed");
  assert.equal(result.reason, "command-timeout");
  assert.equal(result.terminationRequested, true);
  assert.equal(result.terminationAccepted, true);
  assert.equal(result.directChildExitObserved, true);
  assert.equal(result.descendantCleanup, "unknown-not-inspected");
});

test("missing sibling Corepack entry fails explicitly without a shell fallback", async () => {
  await assert.rejects(
    () => resolveCorepackPnpm(join(tmpdir(), "fluid-no-such-node", "node.exe")),
    /No shell or PATH fallback/
  );
});

test("Corepack resolution accepts only supported Node prefix layouts and requires a file", async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), "fluid-corepack-layouts-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const windowsDirectory = join(temporary, "windows/node_modules/corepack/dist");
  const unixDirectory = join(temporary, "unix/lib/node_modules/corepack/dist");
  await mkdir(windowsDirectory, { recursive: true });
  await mkdir(unixDirectory, { recursive: true });
  await writeFile(join(windowsDirectory, "pnpm.js"), "fixture");
  await writeFile(join(unixDirectory, "pnpm.js"), "fixture");
  assert.equal(
    await resolveCorepackPnpm(join(temporary, "windows/node.exe")),
    join(windowsDirectory, "pnpm.js")
  );
  assert.equal(
    await resolveCorepackPnpm(join(temporary, "unix/bin/node")),
    join(unixDirectory, "pnpm.js")
  );
  await mkdir(join(temporary, "not-file/node_modules/corepack/dist/pnpm.js"), { recursive: true });
  await assert.rejects(
    () => resolveCorepackPnpm(join(temporary, "not-file/node")),
    /No shell or PATH fallback/
  );
});
