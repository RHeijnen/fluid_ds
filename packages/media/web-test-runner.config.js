import {
  fluidMochaFramework,
  fluidPlaywrightLauncher
} from "../../scripts/web-test-runner-lifecycle.mjs";
import { esbuildPlugin } from "@web/dev-server-esbuild";
import { fluidCoverage } from "../../scripts/web-test-runner-coverage.mjs";
import { resolveTestBrowsers } from "../../scripts/resolve-test-browsers.mjs";

/** @type {import("@web/test-runner").TestRunnerConfig} */
export default {
  // Distinct port so the root `test` script can run media in parallel with the
  // components suite without colliding on web-test-runner's default :8000.
  port: 8012,
  files: ["src/**/*.test.ts"],
  nodeResolve: true,
  browsers: resolveTestBrowsers().map((product) => fluidPlaywrightLauncher({ product })),
  plugins: [esbuildPlugin({ ts: true, target: "es2022", tsconfig: "./tsconfig.json" })],
  // Full shadow-DOM axe scans of playlists can exceed the default five seconds
  // on slower CI workers.
  testFramework: fluidMochaFramework("10000"),
  ...fluidCoverage("media"),
  testRunnerHtml: (testFramework) => `
    <!doctype html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body><script type="module" src="${testFramework}"></script></body>
    </html>
  `
};
