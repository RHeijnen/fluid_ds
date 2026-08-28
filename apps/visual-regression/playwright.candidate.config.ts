import { defineConfig } from "@playwright/test";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "./playwright.config.js";
import { visualPlatform } from "./visual-platform.js";

const here = dirname(fileURLToPath(import.meta.url));
const evidenceRoot = resolve(here, "candidate-evidence");
const candidateDirectory = resolve(
  process.env.VR_CANDIDATE_DIR ?? resolve(evidenceRoot, "unversioned")
);
const relativeCandidate = relative(evidenceRoot, candidateDirectory);

if (relativeCandidate.startsWith("..") || relativeCandidate === "") {
  throw new Error("VR_CANDIDATE_DIR must be a named directory below candidate-evidence/");
}

process.env.VR_CANDIDATE_CAPTURE = "1";

export default defineConfig(baseConfig, {
  snapshotDir: resolve(candidateDirectory, "screenshots"),
  outputDir: resolve(candidateDirectory, "test-results"),
  updateSnapshots: "all",
  reporter: [
    ["list"],
    ["html", { outputFolder: resolve(candidateDirectory, "report"), open: "never" }],
    ["json", { outputFile: resolve(candidateDirectory, "results.json") }]
  ],
  metadata: {
    visualPlatform,
    accepted: false,
    humanAccepted: false,
    candidateDirectory
  }
});
