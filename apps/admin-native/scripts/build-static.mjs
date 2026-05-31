/**
 * "Build" for a buildless app = copy the static files (already runnable as-is)
 * into dist/. The vendor bundle is produced first by the `prebuild` script
 * (build-vendor.mjs), so dist/ is a self-contained, deployable folder.
 */
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(appDir, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const item of ["index.html", "favicon.svg", "src", "vendor"]) {
  cpSync(resolve(appDir, item), resolve(dist, item), { recursive: true });
}
// The committed vendor/entry.js is the bundler input, not a runtime file.
rmSync(resolve(dist, "vendor/entry.js"), { force: true });

console.log("▻ admin-native → dist/ (static, deployable)");
