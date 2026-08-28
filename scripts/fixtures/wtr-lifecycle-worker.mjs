import { createServer } from "node:http";
import { connect } from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createLifecycle, instrumentLauncher } from "../web-test-runner-lifecycle.mjs";

const mode = process.argv[2];
const send = (type, detail = {}) =>
  process.connected && process.send({ type, detail, at: new Date().toISOString() });
const lifecycle = createLifecycle({
  record: send,
  complete(result) {
    send("complete", result);
    process.exitCode = result.passed ? 0 : 1;
    if (process.connected) process.disconnect();
  }
});
const server = createServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
lifecycle.plugin.serverStart({ server });
const socket = connect(server.address().port, "127.0.0.1");
await once(socket, "connect");
const sidecar = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
  stdio: "ignore",
  windowsHide: true
});
await once(sidecar, "spawn");
send("fixture-resources", { port: server.address().port, sidecarPid: sidecar.pid });
const recorded = once(process, "message");
send("snapshot-request");
const [acknowledgment] = await recorded;
if (acknowledgment.type !== "snapshot-recorded")
  throw new Error("Expected process ownership acknowledgment");
const cleanupBrowser = async () => {
  socket.destroy();
  sidecar.kill();
  await once(sidecar, "exit");
};
const launcher = instrumentLauncher(
  {
    name: "Injected",
    async startSession() {},
    async stopSession() {},
    async stop() {
      if (mode === "hang") await new Promise(() => {});
      await cleanupBrowser();
      if (mode === "reject") throw new Error("Injected launcher.stop rejection");
      if (mode === "hang-after-close") await new Promise(() => {});
    }
  },
  lifecycle
);
process.on("message", (message) => {
  if (message?.type === "shutdown-timeout") {
    lifecycle.fail("shutdown-deadline", "Injected fixture exceeded shutdown deadline");
    lifecycle.closeOwnedConnections();
  }
});
lifecycle.assertionsPassed = mode !== "assertion-fail";
send("assertions-finished", { passed: lifecycle.assertionsPassed });
if (mode === "failure-message") {
  send("failure", { phase: "injected", message: "Failure before shutdown-start" });
  await new Promise(() => {});
}
lifecycle.beginShutdown("assertions-finished");
if (mode === "ipc-disconnect") {
  process.disconnect();
  await new Promise(() => {});
}
// Emulate the upstream scheduler swallowing stop rejection, then stopping HTTP.
await launcher.stop().catch(() => {});
lifecycle.plugin.serverStop();
if (mode === "server-hang") await new Promise(() => {});
await new Promise((resolveClose) => server.close(resolveClose));
lifecycle.stoppedPassed = true;
lifecycle.maybeComplete();
