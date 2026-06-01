import { playwrightLauncher } from "@web/test-runner-playwright";
import { esbuildPlugin } from "@web/dev-server-esbuild";
import { fromRollup } from "@web/dev-server-rollup";
import rollupCommonjs from "@rollup/plugin-commonjs";

// qrcode-generator ships a UMD/CommonJS bundle. Convert it to ESM at serve time
// so the browser can `import` its module.exports factory.
const commonjs = fromRollup(rollupCommonjs);

/**
 * Browser matrix mirrors @fluid-ds/components: Chromium locally for a fast inner
 * loop, all three engines in CI via FLUID_BROWSERS=all.
 */
const ALL = ["chromium", "firefox", "webkit"];

function resolveBrowsers() {
  const raw = process.env.FLUID_BROWSERS?.trim().toLowerCase();
  if (!raw || raw === "chromium") return ["chromium"];
  if (raw === "all") return ALL;
  const ok = raw.split(",").map((s) => s.trim()).filter((b) => ALL.includes(b));
  return ok.length ? ok : ["chromium"];
}

/** @type {import("@web/test-runner").TestRunnerConfig} */
export default {
  // Distinct port so the root `test` script can run this in parallel with the
  // other suites without colliding on web-test-runner's default :8000.
  port: 8031,
  files: ["src/**/*.test.ts"],
  nodeResolve: true,
  browsers: resolveBrowsers().map((product) => playwrightLauncher({ product })),
  plugins: [
    commonjs({
      // Only transform the one CommonJS dependency; leave axe-core and other
      // ESM modules untouched (transforming them breaks their loaders).
      include: ["**/qrcode-generator/**"]
    }),
    esbuildPlugin({
      ts: true,
      target: "es2022",
      tsconfig: "./tsconfig.json"
    })
  ],
  testFramework: {
    config: {
      ui: "bdd",
      timeout: "5000"
    }
  },
  coverage: false,
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
