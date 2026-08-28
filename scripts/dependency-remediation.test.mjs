import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { verifyExtractZipPatch } from "./verify-extract-zip-patch.mjs";
const repositoryRoot = resolve(import.meta.dirname, "..");

function parseVersionFloor(value) {
  const match = /^(?:\^|~)?(\d+)\.(\d+)\.(\d+)$/.exec(value);
  assert.ok(match, `expected a simple semver floor, received ${value}`);
  return match.slice(1).map(Number);
}

function atLeast(actual, expected) {
  for (let index = 0; index < 3; index += 1) {
    if (actual[index] !== expected[index]) return actual[index] > expected[index];
  }
  return true;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("owned manifests retain the critical transitive dependency floors", async () => {
  const rootManifest = await readJson(join(repositoryRoot, "package.json"));
  assert.ok(
    atLeast(parseVersionFloor(rootManifest.devDependencies.concurrently), [9, 2, 4]),
    "concurrently must remain at 9.2.4 or newer so shell-quote resolves to at least 1.9.0"
  );
  assert.equal(
    rootManifest.pnpm?.patchedDependencies?.["extract-zip@2.0.1"],
    "patches/extract-zip@2.0.1.patch",
    "extract-zip must retain the exact reviewed security patch mapping"
  );
  assert.equal(
    rootManifest.pnpm?.overrides?.["tar@7.5.15"],
    "7.5.22",
    "the vulnerable tar resolution must remain narrowly overridden"
  );
  for (const [vulnerable, patched] of Object.entries({
    "axios@1.16.1": "1.18.0",
    "brace-expansion@1.1.15": "1.1.18",
    "brace-expansion@5.0.6": "5.0.9",
    "fast-uri@3.1.2": "3.1.5",
    "form-data@4.0.5": "4.0.6",
    "hono@4.12.23": "4.12.25",
    "immutable@5.1.6": "5.1.8",
    "ip-address@10.2.0": "10.3.1",
    "js-yaml@3.14.2": "3.15.1",
    "js-yaml@4.1.1": "4.3.1",
    "nanoid@3.3.12": "3.3.18",
    "postcss@8.4.31": "8.5.18",
    "postcss@8.5.15": "8.5.18",
    "sharp@0.33.5": "0.35.0",
    "sharp@0.34.5": "0.35.0",
    "svgo@4.0.1": "4.0.2",
    "undici@6.26.0": "6.27.0"
  })) {
    assert.equal(
      rootManifest.pnpm?.overrides?.[vulnerable],
      patched,
      `${vulnerable} must remain narrowly overridden to ${patched}`
    );
  }
  assert.equal(
    createHash("sha256")
      .update(await readFile(join(repositoryRoot, "patches", "extract-zip@2.0.1.patch")))
      .digest("hex"),
    "eb7256cf5bb05c6b698eed8c07015d911dc016a155b815f6e7cfccbf467dc7b0",
    "extract-zip patch content must match the reviewed security fix"
  );

  for (const relativePath of [
    "apps/admin-angular/package.json",
    "scripts/fixtures/framework-pinned/angular/fixture/package.json"
  ]) {
    const manifest = await readJson(join(repositoryRoot, relativePath));
    assert.ok(
      atLeast(parseVersionFloor(manifest.devDependencies["@angular/cli"]), [20, 3, 34]),
      `${relativePath} must retain the Angular CLI 20.3.34 pacote remediation floor`
    );
    assert.ok(
      atLeast(parseVersionFloor(manifest.devDependencies["@angular/build"]), [20, 3, 34]),
      `${relativePath} must keep Angular build tooling aligned with the CLI patch line`
    );
  }

  for (const relativePath of [
    "apps/admin-react/package.json",
    "apps/demos/package.json",
    "apps/landing/package.json",
    "apps/playground/package.json",
    "apps/ssr-tests/package.json",
    "apps/storybook/package.json",
    "apps/wizard/package.json"
  ]) {
    const manifest = await readJson(join(repositoryRoot, relativePath));
    assert.ok(
      atLeast(parseVersionFloor(manifest.devDependencies.vite), [6, 4, 3]),
      `${relativePath} must retain Vite 6.4.3 or newer`
    );
  }

  const docsManifest = await readJson(join(repositoryRoot, "apps/docs/package.json"));
  assert.ok(atLeast(parseVersionFloor(docsManifest.dependencies.astro), [6, 4, 6]));
  assert.ok(
    atLeast(parseVersionFloor(docsManifest.dependencies["@astrojs/starlight"]), [0, 40, 0])
  );
  const astroFixture = await readJson(join(repositoryRoot, "apps/framework-astro/package.json"));
  assert.ok(atLeast(parseVersionFloor(astroFixture.dependencies.astro), [6, 4, 6]));
});

test("the retained Linux patch proof is present and bound to the current lock", async () => {
  const lock = await readFile(join(repositoryRoot, "pnpm-lock.yaml"));
  const proof = await readJson(
    join(
      repositoryRoot,
      "quality/evidence/dependency-risk/local-patches/extract-zip-2.0.1-linux.json"
    )
  );
  assert.equal(proof.status, "passed");
  assert.equal(proof.platform, "linux");
  assert.equal(proof.module, "extract-zip");
  assert.equal(proof.version, "2.0.1");
  assert.equal(proof.lockPatchHash, "5guokmk2c4keaki7w3gnbg3qha");
  assert.equal(
    proof.lockSha256,
    createHash("sha256").update(lock).digest("hex"),
    "retained Linux proof must be regenerated after any lock change"
  );
  assert.deepEqual(
    proof.checks,
    [
      "escaping-symlink-target-rejected",
      "duplicate-symlink-write-rejected",
      "safe-file-and-in-root-symlink-preserved"
    ].map((id) => ({ id, status: "passed" }))
  );
});

test("the root lock retains the reviewed critical remediation graph", async () => {
  const lock = await readFile(join(repositoryRoot, "pnpm-lock.yaml"), "utf8");
  const graph = lock.slice(lock.indexOf("\npackages:\n"));
  for (const pattern of [
    /^ {2}concurrently@9\.2\.4:/m,
    /^ {2}shell-quote@1\.9\.0:/m,
    /^ {2}'@angular\/build@20\.3\.35':/m,
    /^ {2}'@angular\/cli@20\.3\.35':/m,
    /^ {2}astro@6\.4\.8:/m,
    /^ {2}pacote@21\.5\.1:/m,
    /^ {2}tar@7\.5\.22:/m,
    /^ {2}axios@1\.18\.0:/m,
    /^ {2}brace-expansion@1\.1\.18:/m,
    /^ {2}brace-expansion@5\.0\.9:/m,
    /^ {2}fast-uri@3\.1\.5:/m,
    /^ {2}form-data@4\.0\.6:/m,
    /^ {2}hono@4\.12\.25:/m,
    /^ {2}immutable@5\.1\.8:/m,
    /^ {2}ip-address@10\.3\.1:/m,
    /^ {2}js-yaml@3\.15\.1:/m,
    /^ {2}js-yaml@4\.3\.1:/m,
    /^ {2}nanoid@3\.3\.18:/m,
    /^ {2}postcss@8\.5\.18:/m,
    /^ {2}sharp@0\.35\.0:/m,
    /^ {2}svgo@4\.0\.2:/m,
    /^ {2}undici@6\.27\.0:/m,
    /^ {2}vite@6\.4\.3/m,
    /^ {2}extract-zip@2\.0\.1\(patch_hash=5guokmk2c4keaki7w3gnbg3qha\):/m
  ]) {
    assert.match(graph, pattern);
  }
  for (const pattern of [
    /^ {2}concurrently@9\.2\.1:/m,
    /^ {2}shell-quote@1\.8\.3:/m,
    /^ {2}'@angular\/build@20\.3\.26':/m,
    /^ {2}'@angular\/cli@20\.3\.26':/m,
    /^ {2}astro@5\.18\.2:/m,
    /^ {2}pacote@21\.0\.4:/m,
    /^ {2}tar@7\.5\.15:/m,
    /^ {2}axios@1\.16\.1:/m,
    /^ {2}brace-expansion@1\.1\.15:/m,
    /^ {2}brace-expansion@5\.0\.6:/m,
    /^ {2}fast-uri@3\.1\.2:/m,
    /^ {2}form-data@4\.0\.5:/m,
    /^ {2}hono@4\.12\.23:/m,
    /^ {2}immutable@5\.1\.6:/m,
    /^ {2}ip-address@10\.2\.0:/m,
    /^ {2}js-yaml@3\.14\.2:/m,
    /^ {2}js-yaml@4\.1\.1:/m,
    /^ {2}nanoid@3\.3\.12:/m,
    /^ {2}postcss@8\.4\.31:/m,
    /^ {2}postcss@8\.5\.15:/m,
    /^ {2}sharp@0\.33\.5:/m,
    /^ {2}sharp@0\.34\.5:/m,
    /^ {2}svgo@4\.0\.1:/m,
    /^ {2}undici@6\.26\.0:/m,
    /^ {2}vite@5\.4\.21/m,
    /^ {2}vite@6\.4\.2/m
  ]) {
    assert.doesNotMatch(graph, pattern);
  }
  assert.match(
    lock,
    /xlsx@https:\/\/cdn\.sheetjs\.com\/xlsx-0\.20\.3\/xlsx-0\.20\.3\.tgz:\r?\n {4}resolution: \{tarball: https:\/\/cdn\.sheetjs\.com\/xlsx-0\.20\.3\/xlsx-0\.20\.3\.tgz, integrity: sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP\+Neh0SJUzV\/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH\+3AJA==\}/
  );
});

test(
  "the installed extract-zip patch passes the malicious and safe archive proof",
  {
    skip: process.platform !== "linux" ? "symlink archive proof runs on the Linux boundary" : false
  },
  async () => {
    assert.deepEqual(await verifyExtractZipPatch(repositoryRoot, "5guokmk2c4keaki7w3gnbg3qha"), [
      { id: "escaping-symlink-target-rejected", status: "passed" },
      { id: "duplicate-symlink-write-rejected", status: "passed" },
      { id: "safe-file-and-in-root-symlink-preserved", status: "passed" }
    ]);
  }
);
