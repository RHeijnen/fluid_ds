import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { EventEmitter } from "node:events";
import {
  assertPackedConsumer,
  removeWorkspaceLifecycleScripts,
  startDistServer,
  withDeadline,
  isRuntimeComplete,
  runtimeContractNames,
  terminateOwnedChild
} from "./framework-runtime.mjs";

test("browser emergency cleanup owns only its direct handle and requires observed exit", async () => {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  let calls = 0;
  child.kill = (signal) => {
    assert.equal(signal, "SIGKILL");
    calls++;
    queueMicrotask(() => child.emit("exit"));
    return true;
  };
  const result = await terminateOwnedChild(child, 100);
  assert.equal(calls, 1);
  assert.equal(result.directChildExitObserved, true);
  assert.equal(result.descendantCleanup, "unknown-not-inspected");
  child.kill = () => true;
  await assert.rejects(() => terminateOwnedChild(child, 10), /direct-child shutdown exceeded/);
  assert.equal(child.listenerCount("exit"), 0);
  child.exitCode = 0;
  assert.equal((await terminateOwnedChild(child)).terminationRequested, false);
});

test("bounded operations preserve success and reject hung teardown without a retry", async () => {
  assert.equal(await withDeadline(Promise.resolve(42), 100, "quick"), 42);
  await assert.rejects(
    () => withDeadline(new Promise(() => {}), 10, "browser-teardown"),
    /browser-teardown exceeded 10ms/
  );
});

test("runtime success requires each unique engine/contract and clean teardown", () => {
  const results = ["chromium", "firefox", "webkit"].flatMap((engine) =>
    runtimeContractNames.map((contract) => ({ engine, contract, status: "passed" }))
  );
  assert.equal(isRuntimeComplete(results, []), true);
  assert.equal(isRuntimeComplete(results.slice(1), []), false);
  assert.equal(isRuntimeComplete([results[1], ...results.slice(1)], []), false);
  assert.equal(
    isRuntimeComplete([{ ...results[0], status: "failed" }, ...results.slice(1)], []),
    false
  );
  assert.equal(isRuntimeComplete(results, [{ stage: "browser-teardown", error: "hung" }]), false);
});

test("only explicit workspace lifecycle hooks are removed; preview remains replayable", () => {
  const scripts = {
    predev: "workspace build",
    prebuild: "workspace build",
    pretest: "workspace build",
    pretypecheck: "workspace build",
    prepreview: "workspace build",
    prestart: "workspace build",
    preview: "vite preview",
    "prepare-data": "node local.mjs",
    build: "vite build"
  };
  assert.deepEqual(removeWorkspaceLifecycleScripts(scripts), {
    preview: "vite preview",
    "prepare-data": "node local.mjs",
    build: "vite build"
  });
  assert.equal(scripts.prebuild, "workspace build");
});

async function fixture(t) {
  const temporary = await mkdtemp(join(tmpdir(), "fluid-runtime-unit-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const consumer = join(temporary, "fixture");
  const packs = join(temporary, "packs");
  await mkdir(packs);
  await mkdir(join(consumer, "dist"), { recursive: true });
  const dependencies = {};
  for (const name of ["react", "components"]) {
    const directory = join(consumer, "node_modules/@fluid-ds", name);
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, "package.json"),
      JSON.stringify({ exports: { ".": "./dist/index.js" } })
    );
    await writeFile(join(packs, `${name}.tgz`), "unit fixture, never installed");
    dependencies[`@fluid-ds/${name}`] = `file:../packs/${name}.tgz`;
  }
  await writeFile(join(consumer, "package.json"), JSON.stringify({ dependencies }));
  return { temporary, consumer, dependencies };
}

test("packed-consumer guard accepts local published exports and rejects workspace dependencies", async (t) => {
  const { consumer, dependencies } = await fixture(t);
  await assertPackedConsumer(consumer);
  dependencies["@fluid-ds/react"] = "workspace:*";
  await writeFile(join(consumer, "package.json"), JSON.stringify({ dependencies }));
  await assert.rejects(() => assertPackedConsumer(consumer), /must come from a retained tarball/);
});

test("packed-consumer guard rejects source exports even inside a local package", async (t) => {
  const { consumer } = await fixture(t);
  await writeFile(
    join(consumer, "node_modules/@fluid-ds/react/package.json"),
    JSON.stringify({ exports: { "./input": { import: "./src/input.ts" } } })
  );
  await assert.rejects(() => assertPackedConsumer(consumer), /exports workspace source/);
});

test("production server serves built assets but rejects source, traversal and symlink escapes", async (t) => {
  const { consumer, temporary } = await fixture(t);
  const dist = join(consumer, "dist");
  await writeFile(join(dist, "contract.html"), "<h1>Compiled contract</h1>");
  await writeFile(join(dist, "entry.js"), "export const packed = true;");
  await writeFile(join(temporary, "private.js"), "outside the served root");
  await mkdir(join(dist, "src"));
  await writeFile(join(dist, "src/leak.js"), "source must not be served");
  // A directory junction requires no symlink privilege on Windows.
  await symlink(temporary, join(dist, "escape"), process.platform === "win32" ? "junction" : "dir");
  const server = await startDistServer(dist);
  t.after(() => server.close());
  assert.equal(
    await (await fetch(`${server.origin}/contract.html`)).text(),
    "<h1>Compiled contract</h1>"
  );
  assert.equal((await fetch(`${server.origin}/entry.js`)).status, 200);
  for (const path of [
    "/src/leak.js",
    "/@fs/private.js",
    "/node_modules/react.js",
    "/%2e%2e/private.js",
    "/escape/private.js",
    "/entry.js.map"
  ]) {
    assert.equal((await fetch(`${server.origin}${path}`)).status, 404, path);
  }
});
