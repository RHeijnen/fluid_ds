import {
  fluidMochaFramework,
  fluidPlaywrightLauncher
} from "../../scripts/web-test-runner-lifecycle.mjs";
import { esbuildPlugin } from "@web/dev-server-esbuild";
import { fluidCoverage } from "../../scripts/web-test-runner-coverage.mjs";
import { resolveTestBrowsers } from "../../scripts/resolve-test-browsers.mjs";

/** @type {import("@web/test-runner").TestRunnerConfig} */
export default {
  port: 8020,
  files: ["src/**/*.test.ts"],
  nodeResolve: true,
  browsers: resolveTestBrowsers().map((product) => fluidPlaywrightLauncher({ product })),
  plugins: [esbuildPlugin({ ts: true, target: "es2022", tsconfig: "./tsconfig.json" })],
  testFramework: fluidMochaFramework(),
  ...fluidCoverage("table"),
  testRunnerHtml: (tf) =>
    `<!doctype html><html><head><meta charset="utf-8" /></head><body><script type="module" src="${tf}"></script></body></html>`
};
