/**
 * "Build" for a buildless app = copy the static files (already runnable as-is)
 * into dist/. There is no bundling: the page loads Fluid from the CDN via the
 * import map in index.html, so dist/ is just the hand-written sources.
 */
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(appDir, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const item of ["index.html", "favicon.svg", "src"]) {
  cpSync(resolve(appDir, item), resolve(dist, item), { recursive: true });
}

console.log("▻ admin-native → dist/ (static, CDN-loaded, deployable)");
