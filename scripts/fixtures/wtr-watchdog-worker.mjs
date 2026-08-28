import { createServer } from "node:http";

// This rescue is only for testing the old, unbounded supervisor. No descendants
// are created, so an inventory failure cannot leave an unobservable process tree.
const rescue = setTimeout(() => process.exit(71), 8000);
const server = createServer();
server.listen(0, "127.0.0.1", () => {
  process.send({
    type: "fixture-resources",
    detail: { port: server.address().port, workerPid: process.pid }
  });
  if (process.argv[2] !== "startup-never-ready") process.send({ type: "worker-ready", detail: {} });
  if (process.argv[2].startsWith("cleanup-"))
    process.send({ type: "failure", detail: { message: "Injected cleanup trigger" } });
  if (process.argv[2] === "finish-cleanup-race")
    process.send({ type: "snapshot-request", detail: { id: 1 } });
});
process.on("message", (message) => {
  if (process.argv[2] !== "finish-cleanup-race" || message.type !== "snapshot-recorded") return;
  server.close(() => {
    clearTimeout(rescue);
    process.send({ type: "complete", detail: { passed: true } });
    process.disconnect();
  });
});
