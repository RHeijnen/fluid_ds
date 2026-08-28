import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  aggregateArtifactHash,
  sha256,
  validatePinnedProfile
} from "./check-framework-pinned-profile.mjs";
import { artifactHashes, assertPortableLock } from "./framework-packing.mjs";
import { compareFinalSourcePacks } from "./prepare-framework-pinned-corpus.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const profile = JSON.parse(
  await readFile(new URL("./framework-pinned-profile.json", import.meta.url), "utf8")
);

test("the pinned profile declares the exact seven-lane contract", () => {
  assert.deepEqual(validatePinnedProfile(structuredClone(profile)), profile);
  assert.deepEqual(
    profile.lanes.map(({ id, renderingContract }) => [id, renderingContract]),
    [
      ["react", "csr"],
      ["astro", "build-time-static-dsd"],
      ["next", "build-time-static-dsd"],
      ["sveltekit", "build-time-static-dsd"],
      ["vue", "csr"],
      ["angular", "csr"],
      ["vanilla", "csr"]
    ]
  );
});

test("the pinned profile binds the current root lock", async () => {
  assert.equal(
    sha256(await readFile(join(root, "pnpm-lock.yaml"))),
    profile.rootLockSha256,
    "Pinned replay profile is stale for the current root lock"
  );
});

test("profile validation rejects missing, duplicate and unsupported lanes", () => {
  const dishonestRevision = structuredClone(profile);
  dishonestRevision.rootRevision = dishonestRevision.rootBaseRevision;
  delete dishonestRevision.rootBaseRevision;
  assert.throws(() => validatePinnedProfile(dishonestRevision), /base revision/);

  const missing = structuredClone(profile);
  missing.lanes.pop();
  assert.throws(() => validatePinnedProfile(missing), /exactly seven/);

  const duplicate = structuredClone(profile);
  duplicate.lanes[1].manifestName = duplicate.lanes[0].manifestName;
  assert.throws(() => validatePinnedProfile(duplicate), /Duplicate manifest/);

  const requestTime = structuredClone(profile);
  requestTime.lanes[1].renderingContract = "request-time-ssr";
  assert.throws(() => validatePinnedProfile(requestTime), /Unsupported rendering contract/);
});

test("artifact aggregation binds paths and bytes rather than counts", () => {
  const first = aggregateArtifactHash({ "packs/a.tgz": "a", "fixture/package.json": "b" });
  const reordered = aggregateArtifactHash({ "fixture/package.json": "b", "packs/a.tgz": "a" });
  const tampered = aggregateArtifactHash({ "packs/a.tgz": "x", "fixture/package.json": "b" });
  assert.equal(first, reordered);
  assert.notEqual(first, tampered);
  assert.equal(
    sha256("pinned"),
    "3fab5c181bd28a09b64397df76ae2bfaf1eac182979b5fdb7a342858004f36af"
  );
});

test("every pinned retained bundle and consumer lock matches the declared bytes", async () => {
  for (const lane of profile.lanes) {
    const source = join(root, lane.sourceEvidence);
    const hashes = await artifactHashes(source);
    const sourceResult = await readFile(join(source, "result.json"));
    assert.equal(sha256(sourceResult), lane.sourceResultSha256, lane.id);
    assert.equal(JSON.parse(sourceResult).status, "passed", lane.id);
    assert.equal(aggregateArtifactHash(hashes), lane.bundleSha256, lane.id);
    assert.equal(hashes["fixture/pnpm-lock.yaml"], lane.consumerLockSha256, lane.id);
    assertPortableLock(await readFile(join(source, "fixture/pnpm-lock.yaml"), "utf8"));
  }
});

test("final-source pack comparison fails closed for changed or missing archives", async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), "fluid-final-packs-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const lane = profile.lanes[0];
  const source = join(root, lane.sourceEvidence, "packs");
  await cp(source, temporary, { recursive: true });
  const oneLane = { lanes: [lane] };
  assert.ok((await compareFinalSourcePacks(temporary, oneLane)).compared > 0);

  const archive = (await readdir(temporary)).find((name) => name.endsWith(".tgz"));
  assert.ok(archive);
  const original = await readFile(join(temporary, archive));
  await writeFile(join(temporary, archive), "tampered");
  await assert.rejects(() => compareFinalSourcePacks(temporary, oneLane), /final-source/);
  await writeFile(join(temporary, archive), original);
  await rm(join(temporary, archive));
  await assert.rejects(() => compareFinalSourcePacks(temporary, oneLane), /final-source/);
});
