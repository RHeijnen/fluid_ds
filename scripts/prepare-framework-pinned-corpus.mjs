/** Prepare the minimal tracked corpus consumed by the pinned framework replay. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactHashes } from "./framework-packing.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const profilePath = join(root, "scripts/framework-pinned-profile.json");
const corpusRoot = join(root, "scripts/fixtures/framework-pinned");

const sourceEvidence = Object.freeze({
  react: "quality/evidence/framework-fixtures/2026-08-30T19-40-16-868Z--fluid-ds-admin-react",
  astro: "quality/evidence/framework-fixtures/2026-08-30T19-41-54-976Z--fluid-ds-framework-astro",
  next: "quality/evidence/framework-fixtures/2026-08-30T19-43-20-927Z--fluid-ds-admin-next",
  sveltekit:
    "quality/evidence/framework-fixtures/2026-08-30T19-45-19-901Z--fluid-ds-framework-sveltekit",
  vue: "quality/evidence/framework-fixtures/2026-08-30T19-46-16-677Z--fluid-ds-framework-vue",
  angular: "quality/evidence/framework-fixtures/2026-08-30T19-47-00-085Z--fluid-ds-admin-angular",
  vanilla:
    "quality/evidence/framework-fixtures/2026-08-30T19-49-09-622Z--fluid-ds-framework-vanilla"
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function aggregateArtifactHash(hashes) {
  return sha256(
    JSON.stringify(
      Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)))
    )
  );
}

function assertContained(parent, child) {
  const path = relative(resolve(parent), resolve(child));
  assert.ok(path && path !== ".." && !path.startsWith(`..${sep}`), `Path escaped corpus: ${child}`);
}

function sanitizeString(value) {
  return value
    .replace(/[A-Za-z]:\\Users\\[^\\]+\\AppData\\Local\\Temp\\fluid-[^\\/\s"]+/gi, "<TEMP>")
    .replace(/\/tmp\/fluid-[^/\\\s"]+/g, "<TEMP>");
}

function sanitize(value) {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)]));
  return value;
}

async function copyFile(sourceRoot, destinationRoot, name) {
  const destination = join(destinationRoot, name);
  assertContained(destinationRoot, destination);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(sourceRoot, name), destination);
}

export async function compareFinalSourcePacks(candidateDirectory, profile) {
  const candidateRoot = resolve(candidateDirectory);
  const mismatches = [];
  let compared = 0;
  for (const lane of profile.lanes) {
    const packs = join(root, lane.sourceEvidence, "packs");
    for (const entry of await readdir(packs, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".tgz")) continue;
      compared++;
      const expected = sha256(await readFile(join(packs, entry.name)));
      let actual;
      try {
        actual = sha256(await readFile(join(candidateRoot, entry.name)));
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      if (actual !== expected)
        mismatches.push({ lane: lane.id, archive: entry.name, expected, actual: actual ?? null });
    }
  }
  assert.ok(compared > 0, "Pinned profile contains no package archives");
  assert.deepEqual(
    mismatches,
    [],
    "Pinned framework archives differ from the final-source package set"
  );
  return { compared };
}

export async function preparePinnedCorpus() {
  const profile = JSON.parse(await readFile(profilePath, "utf8"));
  const lockSha256 = sha256(await readFile(join(root, "pnpm-lock.yaml")));
  assert.deepEqual(
    profile.lanes.map(({ id }) => id).sort(),
    Object.keys(sourceEvidence).sort(),
    "Pinned source map and profile lanes differ"
  );

  assertContained(join(root, "scripts/fixtures"), corpusRoot);
  await rm(corpusRoot, { recursive: true, force: true });
  await mkdir(corpusRoot, { recursive: true });

  for (const lane of profile.lanes) {
    const source = join(root, sourceEvidence[lane.id]);
    const destination = join(corpusRoot, lane.id);
    const sourceHashes = await artifactHashes(source);
    await mkdir(destination, { recursive: true });
    for (const name of Object.keys(sourceHashes)) await copyFile(source, destination, name);

    const result = sanitize(JSON.parse(await readFile(join(source, "result.json"), "utf8")));
    assert.equal(result.status, "passed", `${lane.id}: source result was not successful`);
    const resultBytes = `${JSON.stringify(result, null, 2)}\n`;
    await writeFile(join(destination, "result.json"), resultBytes);

    const hashes = await artifactHashes(destination);
    assert.ok(
      !Object.keys(hashes).some((name) => name.endsWith(".tsbuildinfo")),
      `${lane.id}: generated TypeScript build info entered the corpus`
    );
    lane.sourceEvidence = `scripts/fixtures/framework-pinned/${lane.id}`;
    lane.sourceResultSha256 = sha256(resultBytes);
    lane.bundleSha256 = aggregateArtifactHash(hashes);
    lane.consumerLockSha256 = hashes["fixture/pnpm-lock.yaml"];
  }

  profile.rootLockSha256 = lockSha256;
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  return profile;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const compareIndex = process.argv.indexOf("--compare-packs");
  if (compareIndex >= 0) {
    const candidateDirectory = process.argv[compareIndex + 1];
    assert.ok(candidateDirectory, "--compare-packs requires a directory");
    const profile = JSON.parse(await readFile(profilePath, "utf8"));
    const result = await compareFinalSourcePacks(candidateDirectory, profile);
    console.log(`Matched ${result.compared} pinned archives to final-source package bytes.`);
  } else {
    const profile = await preparePinnedCorpus();
    console.log(
      `Prepared ${profile.lanes.length} pinned framework corpora for lock ${profile.rootLockSha256}.`
    );
  }
}
