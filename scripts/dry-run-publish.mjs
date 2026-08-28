/** Offline, non-publishing release rehearsal. */
import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { validateTargets } from "./check-package-artifacts.mjs";
import {
  checkManifestOutputs,
  expectedManifestOutputs,
  readRepositoryManifests
} from "./cem/canonical.mjs";

const execFile = promisify(execFileCallback);
const here = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = dirname(here);
export const expectedPackageNames = Object.freeze([
  "@fluid-ds/animations",
  "@fluid-ds/calendar",
  "@fluid-ds/charts",
  "@fluid-ds/components",
  "@fluid-ds/editor",
  "@fluid-ds/icons",
  "@fluid-ds/kanban",
  "@fluid-ds/map",
  "@fluid-ds/markdown",
  "@fluid-ds/media",
  "@fluid-ds/node-graph",
  "@fluid-ds/parser",
  "@fluid-ds/qr",
  "@fluid-ds/react",
  "@fluid-ds/scheduler",
  "@fluid-ds/table",
  "@fluid-ds/themes",
  "@fluid-ds/tokens"
]);

const require = createRequire(import.meta.url);
const { load: parseYaml } = createRequire(require.resolve("eslint"))("js-yaml");
const compare = (a, b) => a.localeCompare(b, "en");

export async function readPublishablePackages(root = repositoryRoot) {
  const records = [];
  for (const entry of await readdir(join(root, "packages"), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, "packages", entry.name);
    const manifest = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    if (!manifest.private) records.push({ dir, manifest });
  }
  records.sort((a, b) => compare(a.manifest.name, b.manifest.name));
  assert.deepEqual(
    records.map((record) => record.manifest.name),
    [...expectedPackageNames],
    "Publishable package inventory changed; review the release contract explicitly"
  );
  return records;
}

export function releaseOrder(records) {
  const byName = new Map(records.map((record) => [record.manifest.name, record]));
  const dependencies = new Map();
  for (const record of records) {
    const names = new Set();
    for (const field of ["dependencies", "optionalDependencies", "peerDependencies"])
      for (const name of Object.keys(record.manifest[field] ?? {}))
        if (byName.has(name)) names.add(name);
    dependencies.set(record.manifest.name, names);
  }
  const ordered = [];
  const remaining = new Set(byName.keys());
  while (remaining.size) {
    const ready = [...remaining]
      .filter((name) =>
        [...dependencies.get(name)].every((dependency) => !remaining.has(dependency))
      )
      .sort(compare);
    assert.ok(ready.length, `Cyclic publish graph: ${[...remaining].sort(compare).join(", ")}`);
    for (const name of ready) {
      remaining.delete(name);
      ordered.push(name);
    }
  }
  return ordered;
}

async function fileExists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function hasExactMarkdownHeading(markdown, expectedHeading) {
  let fence;
  let inHtmlComment = false;
  for (const line of markdown.split(/\r?\n/u)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1];
    if (fence) {
      const closingMarker = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/u)?.[1];
      if (closingMarker?.[0] === fence.character && closingMarker.length >= fence.length)
        fence = undefined;
      continue;
    }
    if (inHtmlComment) {
      if (line.includes("-->")) inHtmlComment = false;
      continue;
    }
    if (marker) {
      fence = { character: marker[0], length: marker.length };
      continue;
    }
    if (line.includes("<!--")) {
      if (!line.includes("-->", line.indexOf("<!--") + 4)) inHtmlComment = true;
      continue;
    }
    if (line === expectedHeading) return true;
  }
  return false;
}

export async function auditPackageMetadata(records, root = repositoryRoot) {
  const failures = [];
  const versions = new Set(records.map((record) => record.manifest.version));
  if (versions.size !== 1)
    failures.push(
      `Fixed release group has divergent versions: ${[...versions].sort(compare).join(", ")}`
    );
  for (const { dir, manifest } of records) {
    const fail = (message) => failures.push(`${manifest.name}: ${message}`);
    if (!/^@fluid-ds\/[a-z][a-z0-9-]*$/.test(manifest.name)) fail("invalid public package name");
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version))
      fail("invalid semver version");
    if (manifest.license !== "MIT") fail("license metadata must be MIT");
    if (manifest.publishConfig?.access !== "public") fail("publishConfig.access must be public");
    if (manifest.publishConfig?.tag !== "latest")
      fail("publishConfig.tag must match the current latest policy");
    if (manifest.author !== "Fluid contributors") fail("author/support owner metadata is missing");
    if (manifest.homepage !== "https://github.com/RHeijnen/fluid_ds")
      fail("homepage metadata is missing");
    if (manifest.bugs?.url !== "https://github.com/RHeijnen/fluid_ds/issues")
      fail("issue-support URL is missing");
    const expectedDirectory = relative(root, dir).replaceAll("\\", "/");
    if (manifest.repository?.directory !== expectedDirectory)
      fail("repository.directory does not identify the package");
    for (const filename of ["README.md", "LICENSE", "CHANGELOG.md"]) {
      const path = join(dir, filename);
      const exists = await fileExists(path);
      if (!exists) fail(`missing ${filename}`);
      if (!(manifest.files ?? []).includes(filename))
        fail(`${filename} is excluded from declared tarball files`);
      if (filename === "CHANGELOG.md" && exists) {
        const expectedHeading = `## ${manifest.version}`;
        const changelog = await readFile(path, "utf8");
        if (!hasExactMarkdownHeading(changelog, expectedHeading))
          fail(`CHANGELOG.md lacks exact current-version heading "${expectedHeading}"`);
      }
    }
    for (const hook of ["prepublishOnly", "prepack", "prepare", "postpack"])
      if (manifest.scripts?.[hook])
        fail(`${hook} lifecycle hook requires explicit ownership review`);
  }
  return failures;
}

export function auditReleaseWorkflow(workflow) {
  const failures = [];
  const release = workflow.jobs?.release;
  if (!release) return ["release workflow has no release job"];
  const steps = release.steps ?? [];
  const build = steps.findIndex((step) => step.run === "pnpm build");
  const dry = steps.findIndex((step) => step.run === "pnpm publish:dry");
  const exact = steps.findIndex(
    (step) => step.name === "Reject an unverified or superseded release checkout"
  );
  const publish = steps.findIndex((step) => step.uses?.startsWith("changesets/action@"));
  if (!(build >= 0 && dry > build && exact > dry && publish > exact))
    failures.push(
      "release order must be build -> offline dry-run -> exact-commit check -> changesets action"
    );
  if (release.permissions?.["id-token"] !== "write")
    failures.push("release job lacks OIDC id-token permission");
  if (release.permissions?.contents !== "write")
    failures.push("release job cannot create the version PR");
  const setupNode = steps.find((step) => step.uses?.startsWith("actions/setup-node@"));
  if (setupNode?.with?.["registry-url"] !== "https://registry.npmjs.org")
    failures.push("release registry URL is not pinned to npmjs");
  if (!steps.some((step) => /npm install --global npm@11\./.test(step.run ?? "")))
    failures.push("release job does not pin an OIDC-capable npm 11 client");
  const action = steps[publish];
  if (!/^pnpm exec changeset publish --tag latest$/.test(action?.with?.publish ?? ""))
    failures.push("changesets publish command or dist-tag changed");
  if (
    [workflow.env, release.env, action?.env].some(
      (environment) => environment?.NODE_AUTH_TOKEN || environment?.NPM_TOKEN
    )
  )
    failures.push("static npm tokens are forbidden; trusted publishing must use OIDC");
  if (!action?.env?.GITHUB_TOKEN) failures.push("changesets action lacks its scoped GitHub token");
  return failures;
}

async function newestMtime(path) {
  let newest = 0;
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, await newestMtime(child));
    else if (entry.isFile()) newest = Math.max(newest, (await stat(child)).mtimeMs);
  }
  return newest;
}

export async function auditArtifactFreshness(records) {
  const failures = [];
  for (const { dir, manifest } of records) {
    if (!(manifest.files ?? []).includes("dist")) continue;
    const dist = join(dir, "dist");
    const rootExport = manifest.exports?.["."];
    const rootTarget =
      manifest.main ??
      manifest.module ??
      (typeof rootExport === "string" ? rootExport : (rootExport?.import ?? rootExport?.default));
    const builtRoot = rootTarget?.startsWith("./dist/")
      ? join(dist, rootTarget.slice("./dist/".length))
      : null;
    if (builtRoot && !(await fileExists(builtRoot))) {
      failures.push(`${manifest.name}: built root artifact is missing`);
      continue;
    }
    if ((await newestMtime(join(dir, "src"))) > (await newestMtime(dist)))
      failures.push(`${manifest.name}: source is newer than dist; rebuild before release`);
  }
  return failures;
}

export async function auditReleaseDryRun(root = repositoryRoot, dependencies = {}) {
  const records = await readPublishablePackages(root);
  const failures = await auditPackageMetadata(records, root);
  for (const record of records)
    for (const failure of await validateTargets(record))
      failures.push(`${record.manifest.name}: ${failure}`);
  failures.push(...(await auditArtifactFreshness(records)));
  try {
    const canonical = await readRepositoryManifests(root);
    await checkManifestOutputs(root, expectedManifestOutputs(canonical.records));
  } catch (error) {
    failures.push(`canonical manifests are stale or unverified: ${error.message}`);
  }
  const workflow = parseYaml(await readFile(join(root, ".github/workflows/release.yml"), "utf8"));
  failures.push(...auditReleaseWorkflow(workflow));
  const changesets = JSON.parse(await readFile(join(root, ".changeset/config.json"), "utf8"));
  if (JSON.stringify(changesets.fixed) !== JSON.stringify([["@fluid-ds/*"]]))
    failures.push(
      "Changesets fixed-version policy no longer covers the Fluid package family exactly"
    );
  const status = dependencies.gitStatus
    ? await dependencies.gitStatus(root)
    : (await execFile("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root }))
        .stdout;
  if (status.trim())
    failures.push("worktree is dirty; release rehearsal refuses uncommitted or untracked inputs");
  return {
    schemaVersion: 1,
    mode: "offline-no-publish",
    networkCommands: [],
    publishCommands: [],
    packageCount: records.length,
    packageOrder: releaseOrder(records),
    version: records[0]?.manifest.version ?? null,
    failures,
    ownerDecisions: [
      "Resolve the policy mismatch: SECURITY.md says pre-1.0 fixes use 0.x.x-alpha.*, while the workflow unconditionally publishes the latest tag and all packages are currently stable 0.4.0.",
      "Confirm npm trusted-publisher configuration, OIDC provenance receipt, and organization signing policy remotely.",
      "Approve rollback policy: deprecate a bad immutable npm version, restore the last known-good graph, and publish a new patch; never unpublish or reuse a version."
    ]
  };
}

async function main() {
  if (process.argv.length !== 2) throw new Error("Usage: node scripts/dry-run-publish.mjs");
  const startedAt = new Date().toISOString();
  const directory = join(
    repositoryRoot,
    "quality/evidence/release-dry-run",
    startedAt.replaceAll(/[:.]/g, "-")
  );
  await mkdir(directory, { recursive: true });
  const result = {
    startedAt,
    ...(await auditReleaseDryRun()),
    completedAt: new Date().toISOString()
  };
  result.status = result.failures.length ? "failed" : "passed";
  await writeFile(join(directory, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Offline release dry-run evidence: ${directory}`);
  console.log(`Package order (${result.packageCount}): ${result.packageOrder.join(" -> ")}`);
  if (result.failures.length)
    throw new Error(`Release dry-run refused:\n${result.failures.join("\n")}`);
  console.log("Release dry-run passed. No network or publish command was executed.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
