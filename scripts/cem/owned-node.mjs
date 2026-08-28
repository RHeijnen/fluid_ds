import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function resolveCorepackPnpm(node = process.execPath) {
  // Windows Node/Corepack and Unix prefix/bin/node are the two supported layouts.
  const candidates = [
    join(dirname(node), "node_modules/corepack/dist/pnpm.js"),
    join(dirname(node), "../lib/node_modules/corepack/dist/pnpm.js")
  ];
  for (const path of candidates) {
    const exists = await stat(path).then(
      (entry) => entry.isFile(),
      (error) => {
        if (error.code === "ENOENT") return false;
        throw error;
      }
    );
    if (exists) return path;
  }
  throw new Error(
    `Corepack pnpm entry is missing from supported Node layouts: ${candidates.join(", ")}. No shell or PATH fallback is permitted.`
  );
}

/** Own only the direct ChildProcess handle; never enumerate or kill PID trees. */
export function runOwnedNode(
  args,
  { cwd, env = process.env, node = process.execPath, timeoutMs = 60_000, teardownMs = 5_000 } = {}
) {
  return new Promise((resolve) => {
    const started = Date.now();
    const result = {
      status: "running",
      reason: null,
      pid: null,
      exitCode: null,
      signal: null,
      directChildExitObserved: false,
      terminationRequested: false,
      terminationAccepted: null,
      descendantCleanup: "unknown-not-inspected",
      stdout: "",
      stderr: ""
    };
    let child;
    let deadline;
    let teardown;
    let finished = false;
    let outputBytes = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(deadline);
      clearTimeout(teardown);
      result.elapsedMs = Date.now() - started;
      if (result.status === "running") result.status = "failed";
      resolve(result);
    };
    const stop = (reason) => {
      if (finished || result.terminationRequested) return;
      result.status = "failed";
      result.reason = reason;
      result.terminationRequested = true;
      try {
        result.terminationAccepted = child.kill("SIGKILL");
      } catch (error) {
        result.terminationError = error.message;
      }
      teardown = setTimeout(() => {
        result.teardownError = "Direct child exit was not observed before the teardown deadline";
        child.stdout?.destroy();
        child.stderr?.destroy();
        child.unref();
        finish();
      }, teardownMs);
    };
    try {
      child = spawn(node, args, {
        cwd,
        env,
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch (error) {
      result.status = "failed";
      result.reason = "spawn-error";
      result.error = error.message;
      finish();
      return;
    }
    result.pid = child.pid ?? null;
    deadline = setTimeout(() => stop("command-timeout"), timeoutMs);
    for (const stream of ["stdout", "stderr"])
      child[stream].on("data", (chunk) => {
        outputBytes += chunk.length;
        if (outputBytes > 32 * 1024 * 1024) stop("output-limit");
        else result[stream] += chunk.toString("utf8");
      });
    child.once("error", (error) => {
      result.status = "failed";
      result.reason = "spawn-error";
      result.error = error.message;
      finish();
    });
    child.once("close", (code, signal) => {
      if (finished) return;
      result.directChildExitObserved = true;
      result.exitCode = code;
      result.signal = signal;
      if (!result.reason) {
        result.status = code === 0 ? "passed" : "failed";
        if (code !== 0) result.reason = "nonzero-exit";
      }
      finish();
    });
  });
}
