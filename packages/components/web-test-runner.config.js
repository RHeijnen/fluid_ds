import {
  fluidMochaFramework,
  fluidPlaywrightLauncher
} from "../../scripts/web-test-runner-lifecycle.mjs";
import { esbuildPlugin } from "@web/dev-server-esbuild";
import { fluidCoverage } from "../../scripts/web-test-runner-coverage.mjs";
import { resolveTestBrowsers } from "../../scripts/resolve-test-browsers.mjs";

/**
 * Browser matrix.
 *
 * Local default: Chromium only, fast iteration.
 * CI: all three engines, gated by the FLUID_BROWSERS env var.
 *
 * Examples:
 *   pnpm test                          # chromium
 *   FLUID_BROWSERS=all pnpm test       # all three
 *   FLUID_BROWSERS=chromium,webkit \
 *     pnpm test                        # a custom subset
 *
 * The CI workflow sets `FLUID_BROWSERS=all` for the verify job so every
 * PR runs cross-engine. Local devs keep the chromium-only default so the
 * inner loop stays under 15 seconds.
 */

/** @type {import("@web/test-runner").TestRunnerConfig} */
export default {
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
  ...fluidCoverage("components"),
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
