import { createServer } from "node:http";

const server = createServer();
server.listen(0, "127.0.0.1", () => {
  process.send({
    type: "fixture-resources",
    detail: { port: server.address().port, workerPid: process.pid }
  });
  process.send({ type: "failure", detail: { message: "Injected failure before shutdown-start" } });
});
// No descendants: the supervisor can only prove termination of its owned worker
// handle when inventory is unavailable. It must not invent descendant evidence.
process.on("message", () => {});
