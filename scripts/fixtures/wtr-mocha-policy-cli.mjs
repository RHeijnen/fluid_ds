import { fileURLToPath } from "node:url";
import { supervise } from "../run-web-tests.mjs";

const result = await supervise({
  cwd: fileURLToPath(new URL("../../packages/components/", import.meta.url)),
  args: [
    "--config",
    fileURLToPath(new URL("./wtr-mocha-policy.config.mjs", import.meta.url)),
    "--concurrency",
    "1"
  ],
  artifactDir: process.argv[2]
});
process.exitCode = result.code;
