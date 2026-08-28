import { readFileSync } from "node:fs";
import { requireCoverageThresholds } from "./coverage-thresholds.mjs";

const enabled = process.env.FLUID_COVERAGE === "true";
const thresholds = JSON.parse(
  readFileSync(new URL("../quality/coverage-thresholds.json", import.meta.url), "utf8")
);

/**
 * Shared coverage settings for browser-native package tests.
 *
 * Coverage remains opt-in for the fast local test loop. CI and the root
 * `test:coverage` command enable it with FLUID_COVERAGE=true.
 */
export function fluidCoverage(packageName) {
  return {
    coverage: enabled,
    coverageConfig: {
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.stories.ts", "src/**/define.ts", "src/**/*.d.ts"],
      report: enabled,
      reportDir: `coverage/${packageName}`,
      reporters: ["lcov", "json-summary", "text-summary"],
      threshold: requireCoverageThresholds(packageName, thresholds)
    }
  };
}
