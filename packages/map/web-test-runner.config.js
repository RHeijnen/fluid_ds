import { playwrightLauncher } from "@web/test-runner-playwright";
import { esbuildPlugin } from "@web/dev-server-esbuild";

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
  port: 8024,
  files: ["src/**/*.test.ts"],
  nodeResolve: true,
  browsers: resolveBrowsers().map((product) => playwrightLauncher({ product })),
  plugins: [esbuildPlugin({ ts: true, target: "es2022", tsconfig: "./tsconfig.json" })],
  testFramework: { config: { ui: "bdd", timeout: "5000" } },
  coverage: false,
  testRunnerHtml: (tf) => `<!doctype html><html><head><meta charset="utf-8" /></head><body><script type="module" src="${tf}"></script></body></html>`
};
