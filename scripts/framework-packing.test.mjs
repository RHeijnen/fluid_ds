import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  artifactHashes,
  assertPortableLock,
  copyConsumer,
  createPackedOverrides
} from "./framework-packing.mjs";

test("React internal development edges avoid nondeterministic workspace rewrites during pack", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../packages/react/package.json", import.meta.url), "utf8")
  );
  const internal = Object.entries(manifest.devDependencies).filter(([name]) =>
    name.startsWith("@fluid-ds/")
  );
  assert.ok(internal.length > 0);
  for (const [name, range] of internal) {
    assert.equal(range, manifest.version, `${name} must pack without a workspace-protocol rewrite`);
  }
});

test("packed graph overrides only concrete dependency edges, leaving peers untouched", () => {
  const records = [
    {
      manifest: {
        name: "@fluid-ds/components",
        version: "0.4.0",
        dependencies: { "@fluid-ds/icons": "workspace:*" },
        optionalDependencies: { "@fluid-ds/tokens": "workspace:*" },
        peerDependencies: { lit: "^3" }
      }
    },
    {
      manifest: {
        name: "@fluid-ds/react",
        version: "0.0.0",
        peerDependencies: { "@fluid-ds/components": "^0.4.0" }
      }
    }
  ];
  const original = structuredClone(records);
  assert.deepEqual(
    createPackedOverrides(records, {
      "@fluid-ds/components": "file:../packs/components.tgz",
      "@fluid-ds/icons": "file:../packs/icons.tgz",
      "@fluid-ds/tokens": "file:../packs/tokens.tgz"
    }),
    {
      "@fluid-ds/components@0.4.0>@fluid-ds/icons": "file:../packs/icons.tgz",
      "@fluid-ds/components@0.4.0>@fluid-ds/tokens": "file:../packs/tokens.tgz"
    }
  );
  assert.deepEqual(records, original);
});

test("dependency/peer overlap is rejected instead of rewriting a genuine peer contract", () => {
  assert.throws(
    () =>
      createPackedOverrides(
        [
          {
            manifest: {
              name: "dual",
              version: "1.0.0",
              dependencies: { dep: "^1" },
              peerDependencies: { dep: "^1" }
            }
          }
        ],
        { dep: "file:../packs/dep.tgz" }
      ),
    /both dependency and peer/
  );
});

test("portable lock validation rejects absolute, linked and escaping dependencies", () => {
  assertPortableLock(
    "dependency: file:../packs/a.tgz(lit@3.3.3)\npeerDependencies:\n  react: '^19.0.0'"
  );
  for (const bad of [
    "file:C:\\Temp\\a.tgz",
    "file:/tmp/a.tgz",
    "file:../../elsewhere/a.tgz",
    "link:../workspace",
    "workspace:*"
  ]) {
    assert.throws(() => assertPortableLock(bad));
  }
  assertPortableLock("packages:\n  '@fluid-ds/components@file:../packs/components.tgz':\n");
  assert.throws(
    () => assertPortableLock("packages:\n  '@fluid-ds/icons@0.4.0':\n"),
    /outside retained tarballs/
  );
});

test("artifact hashes prove copied source/graph identity and detect tampered tarballs or locks", async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), "fluid-packing-unit-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await mkdir(join(temporary, "packs"));
  await mkdir(join(temporary, "fixture/dist"), { recursive: true });
  await writeFile(join(temporary, "packs/pkg.tgz"), "original packed bytes");
  await writeFile(join(temporary, "fixture/package.json"), "{}");
  await writeFile(join(temporary, "fixture/pnpm-lock.yaml"), "original lock");
  await writeFile(join(temporary, "fixture/dist/built.js"), "not replay input");
  await writeFile(join(temporary, "fixture/tsconfig.tsbuildinfo"), "not replay input");
  const before = await artifactHashes(temporary);
  assert.equal(Object.keys(before).length, 3);
  await copyConsumer(join(temporary, "fixture"), join(temporary, "copy/fixture"));
  await cp(join(temporary, "packs"), join(temporary, "copy/packs"), { recursive: true });
  assert.deepEqual(await artifactHashes(join(temporary, "copy")), before);
  await assert.rejects(() => readFile(join(temporary, "copy/fixture/tsconfig.tsbuildinfo")));
  await writeFile(join(temporary, "packs/pkg.tgz"), "tampered packed bytes");
  assert.notDeepEqual(await artifactHashes(temporary), before);
  await writeFile(join(temporary, "packs/pkg.tgz"), "original packed bytes");
  await writeFile(join(temporary, "fixture/pnpm-lock.yaml"), "changed lock");
  assert.notDeepEqual(await artifactHashes(temporary), before);
});
