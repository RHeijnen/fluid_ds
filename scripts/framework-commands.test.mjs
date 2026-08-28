import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { frameworkCommandDeadlines, runFrameworkCommand } from "./framework-commands.mjs";

async function fixture(t) {
  const cwd = await mkdtemp(join(tmpdir(), "fluid-framework-commands-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return { cwd, logPath: join(cwd, "install.log"), outcomes: [], stage: "install", quiet: true };
}

test("framework commands use direct Node arguments, finite stage deadlines and retained outcomes", async (t) => {
  const options = await fixture(t);
  await runFrameworkCommand(["install", "--frozen-lockfile"], options, {
    resolveCorepackPnpm: async () => "C:/known/corepack/pnpm.js",
    runOwnedNode: async (args, launch) => {
      assert.deepEqual(args, ["C:/known/corepack/pnpm.js", "install", "--frozen-lockfile"]);
      assert.equal(launch.timeoutMs, frameworkCommandDeadlines.install);
      assert.equal(launch.cwd, options.cwd);
      return {
        status: "passed",
        directChildExitObserved: true,
        stdout: "normal output",
        stderr: ""
      };
    }
  });
  assert.equal(options.outcomes[0].status, "passed");
  assert.equal(await readFile(options.logPath, "utf8"), "normal output");
  assert.equal(
    JSON.parse(await readFile(`${options.logPath}.result.json`, "utf8")).status,
    "passed"
  );
});

test("timeouts and unobserved exits retain failures; successful cleanup cannot turn them green", async (t) => {
  for (const outcome of [
    { status: "failed", reason: "command-timeout", directChildExitObserved: true },
    { status: "passed", directChildExitObserved: false }
  ]) {
    const options = await fixture(t);
    await assert.rejects(
      () =>
        runFrameworkCommand(["install"], options, {
          resolveCorepackPnpm: async () => "known-entry",
          runOwnedNode: async () => ({ ...outcome, stdout: "partial", stderr: "diagnostic" })
        }),
      /Framework install failed/
    );
    assert.equal(options.outcomes[0].status, "failed");
    assert.equal(await readFile(options.logPath, "utf8"), "partialdiagnostic");
  }
});

test("missing Corepack fails without running and retains setup failure; unknown stages fail closed", async (t) => {
  const options = await fixture(t);
  await assert.rejects(
    () =>
      runFrameworkCommand(["install"], options, {
        resolveCorepackPnpm: async () => {
          throw new Error("missing Corepack");
        },
        runOwnedNode: () => {
          throw new Error("must never launch");
        }
      }),
    /missing Corepack/
  );
  assert.equal(
    JSON.parse(await readFile(`${options.logPath}.result.json`, "utf8")).reason,
    "setup-error"
  );
  await assert.rejects(
    () => runFrameworkCommand([], { ...options, stage: "arbitrary" }),
    /Unsupported/
  );
});
