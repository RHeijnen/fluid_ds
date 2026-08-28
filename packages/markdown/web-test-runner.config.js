import {
  fluidMochaFramework,
  fluidPlaywrightLauncher
} from "../../scripts/web-test-runner-lifecycle.mjs";
import { esbuildPlugin } from "@web/dev-server-esbuild";
import { fluidCoverage } from "../../scripts/web-test-runner-coverage.mjs";
import { resolveTestBrowsers } from "../../scripts/resolve-test-browsers.mjs";

/**
 * Browser matrix mirrors @fluid-ds/components: Chromium locally for a fast inner
 * loop, all three engines in CI via FLUID_BROWSERS=all. marked is pure ESM, so
 * unlike the qr pack we need no CommonJS interop plugin here.
 */

/** @type {import("@web/test-runner").TestRunnerConfig} */
export default {
  // Distinct port so the root `test` script can run this in parallel with the
  // other suites without colliding on web-test-runner's default :8000.
  port: 8033,
  files: ["src/**/*.test.ts"],
  nodeResolve: true,
  browsers: resolveTestBrowsers().map((product) => fluidPlaywrightLauncher({ product })),
  plugins: [
    esbuildPlugin({
      ts: true,
      target: "es2022",
      tsconfig: "./tsconfig.json"
    })
  ],
  testFramework: fluidMochaFramework(),
  ...fluidCoverage("markdown"),
  testRunnerHtml: (testFramework) => `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `
};
