import { defineConfig } from "@playwright/test";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "./playwright.config.js";
import { visualPlatform } from "./visual-platform.js";

const here = dirname(fileURLToPath(import.meta.url));
const stabilityRoot = resolve(here, "candidate-evidence", "stability");
const runDirectory = resolve(process.env.VR_STABILITY_DIR ?? resolve(stabilityRoot, "invalid"));
const kind = process.env.VR_STABILITY_KIND;
const child = relative(stabilityRoot, runDirectory);

if (!child || child.startsWith("..") || !["candidate", "accepted-smoke"].includes(kind ?? "")) {
  throw new Error(
    "VR_STABILITY_DIR must be below candidate-evidence/stability and VR_STABILITY_KIND must be candidate or accepted-smoke"
  );
}

export default defineConfig(baseConfig, {
  snapshotDir: resolve(runDirectory, kind!, "screenshots"),
  outputDir: resolve(runDirectory, kind!, "test-results"),
  updateSnapshots: "all",
  reporter: [["list"], ["json", { outputFile: resolve(runDirectory, kind!, "results.json") }]],
  metadata: {
    visualPlatform,
    accepted: false,
    humanAccepted: false,
    stabilityKind: kind,
    runDirectory
  }
});
