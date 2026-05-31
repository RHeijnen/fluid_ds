/**
 * Walks every publishable package, runs `pnpm publish --dry-run`, and
 * surfaces what the tarball would contain. Catches `files` / `exports` /
 * `publishConfig` problems before the first real release.
 *
 * Common failures this catches:
 *   - a `src/` directory missing from `files`, so dev-mode `exports` ->
 *     `src/*.ts` would 404 once the package is installed
 *   - a file referenced in `publishConfig.exports` not actually built
 *   - a missing LICENSE / README that npm would complain about
 *
 * Run via `pnpm run publish:dry`.
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesRoot = join(root, "packages");

async function listPackages() {
  const dirs = await readdir(packagesRoot, { withFileTypes: true });
  return dirs.filter((d) => d.isDirectory()).map((d) => join(packagesRoot, d.name));
}

function runPublishDry(cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["publish", "--dry-run", "--no-git-checks"], {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function main() {
  const packages = await listPackages();
  let failures = 0;
  for (const pkgDir of packages) {
    const pkgJson = JSON.parse(await readFile(join(pkgDir, "package.json"), "utf8"));
    if (pkgJson.private) {
      console.log(`▻ skipping ${pkgJson.name} (private)`);
      continue;
    }
    const rel = relative(root, pkgDir);
    console.log(`\n▻ ${pkgJson.name}  (${rel})`);
    const { code, stdout, stderr } = await runPublishDry(pkgDir);
    process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    if (code !== 0) {
      failures += 1;
      console.error(`  ✗ publish --dry-run exited ${code}`);
    } else {
      console.log(`  ✓ would publish cleanly`);
    }
  }
  if (failures > 0) {
    console.error(`\n${failures} package(s) failed dry-run publish.`);
    process.exit(1);
  }
  console.log(`\n${packages.length} package(s) ready to publish.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
