import { createRequire } from "node:module";
import { resolve } from "node:path";

const key = Symbol.for("fluid.wtr.lifecycle");

/** Certification batches reject excluded tests; ordinary interactive runs stay flexible. */
export function fluidMochaFramework(timeout = "5000") {
  const certification = Boolean(globalThis[key]) || Boolean(process.env.CI);
  return {
    config: {
      ui: "bdd",
      timeout,
      forbidOnly: certification,
      forbidPending: certification
    }
  };
}

/** Preserve real Mocha failures even when an adapter also marks a test skipped. */
export function serializedTestFailures(sessions) {
  const failures = [];
  for (const session of sessions) {
    const visit = (suite, parents = []) => {
      if (!suite) return;
      const path = [...parents, suite.name].filter(Boolean);
      for (const test of suite.tests ?? []) {
        if (test.error) {
          failures.push(
            `${session.testFile}: ${[...path, test.name].join(" > ")}: ${test.error.message ?? "Test error"}`
          );
        }
      }
      for (const child of suite.suites ?? []) visit(child, path);
    };
    visit(session.testResults);
  }
  return failures;
}

/** Public launcher methods only. Stock CLI/watch runs retain the stock launcher. */
export function fluidPlaywrightLauncher(options) {
  const { playwrightLauncher } = createRequire(resolve(process.cwd(), "package.json"))(
    "@web/test-runner-playwright"
  );
  const launcher = playwrightLauncher(options);
  const lifecycle = globalThis[key];
  if (!lifecycle) return launcher;
  return instrumentLauncher(launcher, lifecycle);
}

export function instrumentLauncher(launcher, lifecycle) {
  const name = `${launcher.name}-${lifecycle.launchers.size + 1}`;
  lifecycle.launchers.set(name, "idle");
  let observedBrowser = false;
  for (const method of ["startSession", "stopSession", "stop"]) {
    const original = launcher[method].bind(launcher);
    launcher[method] = async (...args) => {
      const phase = `${name}.${method}${method === "stop" ? "" : `:${args[0]}`}`;
      if (method === "stop") lifecycle.launchers.set(name, "stopping");
      lifecycle.record("phase-start", { phase });
      try {
        if (method === "stop") await lifecycle.captureProcesses?.();
        const result = await original(...args);
        if (method === "startSession" && !observedBrowser) {
          observedBrowser = true;
          await lifecycle.captureProcesses?.();
        }
        if (method === "stop") {
          lifecycle.launchers.set(name, "stopped");
        }
        lifecycle.record("phase-end", { phase });
        lifecycle.maybeComplete();
        return result;
      } catch (error) {
        lifecycle.fail(phase, error);
        if (method === "stop") lifecycle.launchers.set(name, "failed");
        lifecycle.maybeComplete();
        throw error;
      }
    };
  }
  return launcher;
}

export function createLifecycle({ record, complete }) {
  const state = {
    launchers: new Map(),
    failures: [],
    sockets: new Set(),
    server: undefined,
    serverClosed: false,
    assertionsPassed: undefined,
    stoppedPassed: undefined,
    shutdownStarted: false,
    completed: false,
    record,
    fail(phase, error) {
      const failure = { phase, message: error instanceof Error ? error.message : String(error) };
      state.failures.push(failure);
      record("failure", failure);
    },
    beginShutdown(reason) {
      if (state.shutdownStarted) return;
      state.shutdownStarted = true;
      record("shutdown-start", { reason });
    },
    maybeComplete() {
      if (state.completed || state.stoppedPassed === undefined || !state.serverClosed) return;
      if ([...state.launchers.values()].some((value) => !["stopped", "failed"].includes(value)))
        return;
      state.completed = true;
      complete({
        passed:
          state.assertionsPassed === true &&
          state.stoppedPassed === true &&
          state.failures.length === 0,
        failures: state.failures,
        launchers: Object.fromEntries(state.launchers),
        serverClosed: state.serverClosed,
        remainingSockets: state.sockets.size
      });
    },
    closeOwnedConnections() {
      record("forced-owned-server-close", { connections: state.sockets.size });
      for (const socket of state.sockets) socket.destroy();
      if (state.server?.listening) state.server.close();
    },
    plugin: {
      name: "fluid-wtr-lifecycle",
      serverStart({ server }) {
        state.server = server;
        if (!server) throw new Error("Lifecycle supervision requires an owned HTTP server");
        record("server-start", { address: server.address() });
        server.on("connection", (socket) => {
          state.sockets.add(socket);
          socket.once("close", () => state.sockets.delete(socket));
        });
        server.on("error", (error) => state.fail("server", error));
        server.once("close", () => {
          state.serverClosed = true;
          record("server-closed", {});
          state.maybeComplete();
        });
      },
      serverStop() {
        record("server-stop-requested", {});
      }
    }
  };
  globalThis[key] = state;
  return state;
}
