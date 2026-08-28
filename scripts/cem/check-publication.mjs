import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkManifestOutputs,
  expectedManifestOutputs,
  readRepositoryManifests
} from "./canonical.mjs";
import { inspectPackedCem } from "./publication.mjs";
import { resolveCorepackPnpm, runOwnedNode } from "./owned-node.mjs";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const pack = args.length === 1 && args[0] === "--pack";
if (!pack && !(args.length === 2 && args[0] === "--packs"))
  throw new Error(
    "Usage: node scripts/cem/check-publication.mjs --pack | --packs <archive-directory>"
  );
const startedAt = new Date().toISOString();
const evidence = join(
  root,
  "quality/evidence",
  `${startedAt.replaceAll(/[:.]/g, "-")}-cem-publication`
);
const archives = pack ? join(evidence, "packs") : resolve(args[1]);
const result = {
  status: "running",
  scope: "canonical-manifest-publication-only",
  startedAt,
  packedHere: pack,
  commandOutcomes: [],
  packages: []
};
await mkdir(evidence, { recursive: true });
if (pack) await mkdir(archives);
const save = () => writeFile(join(evidence, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
await save();
console.log(`CEM publication evidence: ${evidence}`);

async function packPackage(directory, name) {
  const descriptor = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
  for (const hook of ["prepack", "prepare", "postpack"]) {
    if (descriptor.scripts?.[hook])
      throw new Error(`${name}: pack lifecycle hook ${hook} requires an explicit ownership review`);
  }
  const entry = await resolveCorepackPnpm();
  const outcome = await runOwnedNode([entry, "pack", "--pack-destination", archives], {
    cwd: directory,
    env: { ...process.env, CI: "true", PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false" }
  });
  const { stdout, stderr, ...metadata } = outcome;
  result.commandOutcomes.push({ package: name, ...metadata });
  await writeFile(join(evidence, `${name}.pack.log`), `${stdout}${stderr}`);
  await save();
  if (outcome.status !== "passed") throw new Error(`${name}: pnpm pack failed: ${outcome.reason}`);
}

try {
  const { records, registry } = await readRepositoryManifests(root);
  await checkManifestOutputs(root, expectedManifestOutputs(records));
  result.expectedPackages = records.length;
  result.expectedTags = registry.length;
  for (const record of records) {
    const name = record.packageName.split("/")[1];
    const directory = join(root, "packages", name);
    const descriptor = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
    if (pack) await packPackage(directory, name);
    const filename = `fluid-ds-${name}-${descriptor.version}.tgz`;
    const checked = await inspectPackedCem(join(archives, filename), {
      ...record,
      version: descriptor.version
    });
    result.packages.push({ ...checked, archive: join(archives, filename) });
    await save();
    console.log(
      `${record.packageName}: ${checked.tags} canonical tags present in the actual tarball.`
    );
  }
  // Source regeneration during a run must not silently leave stale CEM evidence.
  const current = await readRepositoryManifests(root);
  await checkManifestOutputs(root, expectedManifestOutputs(current.records));
  const expected = expectedManifestOutputs(records);
  if (current.records.length !== records.length)
    throw new Error("Canonical package inventory changed during publication verification");
  for (const [path, bytes] of expectedManifestOutputs(current.records)) {
    if (expected.get(path) !== bytes)
      throw new Error("Canonical source metadata changed during publication verification");
  }
  result.status = "passed";
} catch (error) {
  result.status = "failed";
  result.error = error.stack ?? String(error);
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  await save();
  console.log(
    `${result.status}: ${result.packages.length}/${result.expectedPackages ?? "unknown"} CEM tarball checks. Nothing was published.`
  );
}
