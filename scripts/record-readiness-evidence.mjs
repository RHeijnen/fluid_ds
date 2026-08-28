/** Record existing gates without changing their assertions or accepting failures. */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { arch, release, platform } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const [gate, command, ...args] = process.argv.slice(2);
if (!gate || !/^[a-z0-9-]+$/.test(gate) || !command) {
  throw new Error(
    "Usage: node scripts/record-readiness-evidence.mjs <gate-id> <command> [...args]"
  );
}
const startedAt = new Date().toISOString();
const declaredPackageManager = JSON.parse(
  await readFile(join(root, "package.json"), "utf8")
).packageManager;
// `corepack pnpm` can still execute scripts whose nested bare `pnpm` resolves
// to a different installation. Record and reject that misleading toolchain.
const resolvedPnpm = spawnSync("pnpm", ["--version"], {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32"
});
const resolvedPnpmVersion = resolvedPnpm.stdout?.trim().split(/\r?\n/).at(-1) ?? null;
if (command.replace(/\.cmd$/, "") === "pnpm" || (command === "corepack" && args[0] === "pnpm")) {
  if (resolvedPnpm.status !== 0 || `pnpm@${resolvedPnpmVersion}` !== declaredPackageManager) {
    throw new Error(
      `Nested pnpm resolves to ${resolvedPnpmVersion ?? "unavailable"}, expected ${declaredPackageManager}. Put the matching Corepack shims on PATH before recording this gate.`
    );
  }
}
const evidenceRoot = join(root, "quality/evidence");
const directory = join(evidenceRoot, `${startedAt.replaceAll(/[:.]/g, "-")}-${gate}`);
await mkdir(evidenceRoot, { recursive: true });
await mkdir(directory);

function git(args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024
  });
  if (result.status !== 0) throw new Error(result.stderr || "Cannot read git state");
  return result.stdout;
}

async function sourceIdentity() {
  const names = git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(
      (name) =>
        name &&
        !name.startsWith("quality/evidence/") &&
        !/(^|\/)(playwright-report|test-results|\.svelte-kit|\.next|\.angular)\//.test(name)
    )
    .sort();
  const hash = createHash("sha256");
  for (const name of [...new Set(names)]) {
    hash.update(name).update("\0");
    try {
      hash.update(readFileSync(join(root, name)));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      hash.update("<deleted>");
    }
    hash.update("\0");
  }
  return hash.digest("hex");
}

console.log(`Recording ${gate}; fingerprinting working tree...`);
const metadata = {
  schemaVersion: 1,
  gate,
  command: [command, ...args],
  startedAt,
  environment: {
    node: process.version,
    platform: platform(),
    release: release(),
    arch: arch(),
    packageManager: declaredPackageManager,
    resolvedPnpmVersion,
    CI: "true",
    PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false",
    FLUID_BROWSERS: process.env.FLUID_BROWSERS ?? "default"
  },
  git: {
    branch: git(["branch", "--show-current"]).trim(),
    head: git(["rev-parse", "HEAD"]).trim(),
    dirty: Boolean(git(["status", "--porcelain=v1"]).trim()),
    sourceSha256Before: await sourceIdentity()
  },
  lockfileSha256: createHash("sha256")
    .update(await readFile(join(root, "pnpm-lock.yaml")))
    .digest("hex"),
  status: "running"
};
await writeFile(join(directory, "result.json"), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Evidence: ${directory}`);
const log = createWriteStream(join(directory, "output.log"), { flags: "wx" });
const child = spawn(command, args, {
  cwd: root,
  shell: process.platform === "win32",
  env: { ...process.env, CI: "true", PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false" },
  stdio: ["ignore", "pipe", "pipe"]
});
child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  log.write(chunk);
});
child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  log.write(chunk);
});
const result = await new Promise((resolve) => {
  child.on("error", (error) => resolve({ exitCode: null, error: error.message }));
  child.on("close", (exitCode, signal) => resolve({ exitCode, signal }));
});
await new Promise((resolve) => log.end(resolve));
metadata.finishedAt = new Date().toISOString();
metadata.durationSeconds = (Date.parse(metadata.finishedAt) - Date.parse(startedAt)) / 1000;
metadata.git.sourceSha256After = await sourceIdentity();
metadata.sourceChangedDuringRun =
  metadata.git.sourceSha256Before !== metadata.git.sourceSha256After;
metadata.result = result;
metadata.status = result.exitCode === 0 ? "passed" : "failed";
await writeFile(join(directory, "result.json"), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(
  `Recorded ${gate}: ${metadata.status}; source changed: ${metadata.sourceChangedDuringRun}`
);
process.exitCode = result.exitCode ?? 1;
