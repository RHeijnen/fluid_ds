import { fileURLToPath } from "node:url";
import { supervise } from "../run-web-tests.mjs";
import { processSnapshot, terminateOwned } from "../wtr-process-tree.mjs";

const result = await supervise({
  worker: fileURLToPath(
    new URL(
      process.argv[2] === "inventory-fail"
        ? "./wtr-inventory-failure-worker.mjs"
        : "./wtr-lifecycle-worker.mjs",
      import.meta.url
    )
  ),
  args: [process.argv[2]],
  artifactDir: process.argv[3],
  shutdownTimeout: 3000,
  ...(process.argv[2] === "inventory-fail"
    ? {
        processOperations: {
          snapshot: async () => {
            throw new Error("Injected persistent inventory failure");
          },
          terminate: async () => {
            throw new Error("Injected cleanup inventory failure");
          }
        }
      }
    : process.argv[2] === "ambiguous-ownership"
      ? {
          processOperations: {
            snapshot: async ({ workerPid }) => {
              const rows = await processSnapshot();
              const worker = rows.find((entry) => entry.pid === workerPid);
              if (worker)
                rows.push({
                  ...worker,
                  pid: 2147483646,
                  parent: worker.pid,
                  birth: "unparseable",
                  name: "injected-unverifiable-candidate"
                });
              return rows;
            },
            terminate: terminateOwned
          }
        }
      : {})
});
process.exitCode = result.code;
