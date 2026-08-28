import { fileURLToPath } from "node:url";
import core from "../../packages/components/web-test-runner.config.js";

const fixture = process.env.FLUID_MOCHA_POLICY_CASE;
if (!["normal", "only", "suite-only", "skip", "suite-skip", "runtime-skip"].includes(fixture))
  throw new Error("Unknown Mocha policy fixture");
const baseline = process.env.FLUID_MOCHA_POLICY_BASELINE === "true";

export default {
  ...core,
  rootDir: fileURLToPath(new URL("../../", import.meta.url)),
  files: [fileURLToPath(new URL(`./wtr-mocha-policy/${fixture}.js`, import.meta.url))],
  port: 8049,
  // Only this disposable fixture can recreate the old permissive policy.
  testFramework: baseline ? { config: { ui: "bdd", timeout: "5000" } } : core.testFramework,
  coverage: false
};
