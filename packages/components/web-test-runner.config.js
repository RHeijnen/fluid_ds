import { playwrightLauncher } from "@web/test-runner-playwright";
import { esbuildPlugin } from "@web/dev-server-esbuild";

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
const ALL = ["chromium", "firefox", "webkit"];

function resolveBrowsers() {
  const raw = process.env.FLUID_BROWSERS?.trim().toLowerCase();
  if (!raw || raw === "chromium") return ["chromium"];
  if (raw === "all") return ALL;
  const requested = raw.split(",").map((s) => s.trim());
  const ok = requested.filter((b) => ALL.includes(b));
  if (!ok.length) {
    console.warn(`[web-test-runner] FLUID_BROWSERS="${raw}" matched none of ${ALL.join("/")}, falling back to chromium`);
    return ["chromium"];
  }
  return ok;
}

/** @type {import("@web/test-runner").TestRunnerConfig} */
export default {
  files: ["src/**/*.test.ts"],
  nodeResolve: true,
  browsers: resolveBrowsers().map((product) => playwrightLauncher({ product })),
  plugins: [
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
