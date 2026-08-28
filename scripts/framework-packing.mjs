import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, readFile, readdir } from "node:fs/promises";
import { join, sep } from "node:path";

export const consumerBuildDirectories = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".angular",
  ".astro",
  ".svelte-kit",
  "out",
  "out-tsc"
]);

export function isConsumerBuildArtifact(name) {
  return consumerBuildDirectories.has(name) || name.endsWith(".tsbuildinfo");
}

/** Pin actual package dependencies without rewriting unrelated semver peers. */
export function createPackedOverrides(records, packedDependencies) {
  const overrides = {};
  for (const { manifest } of records) {
    for (const dependency of Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies
    })) {
      if (!packedDependencies[dependency]) continue;
      assert.ok(
        !manifest.peerDependencies?.[dependency],
        `${manifest.name} declares ${dependency} as both dependency and peer; a file override would rewrite the peer contract`
      );
      overrides[`${manifest.name}@${manifest.version}>${dependency}`] =
        packedDependencies[dependency];
    }
  }
  return overrides;
}

/** pnpm 9 global file overrides can leak temporary absolute paths into peers. */
export function assertPortableLock(lockfile) {
  assert.doesNotMatch(
    lockfile,
    /(?:workspace|link):/,
    "A packed replay must not depend on workspace links"
  );
  for (const [, path] of lockfile.matchAll(/file:([^\s'"(),}]+)/g)) {
    assert.match(
      path,
      /^\.\.\/packs\/[^/\\]+\.tgz$/,
      `Non-portable local dependency: file:${path}`
    );
  }
  // pnpm 9 quotes scoped package/snapshot keys. No Fluid edge may silently
  // resolve from the registry while root-level packages still look packed.
  for (const [, name, resolution] of lockfile.matchAll(
    /^ {2}'(@fluid-ds\/[^@']+)@([^'\r\n]+)':$/gm
  )) {
    assert.match(
      resolution,
      /^file:\.\.\/packs\/[^/\\]+\.tgz(?:\(|$)/,
      `${name} resolved outside retained tarballs`
    );
  }
}

export async function copyConsumer(source, destination) {
  await cp(source, destination, {
    recursive: true,
    filter: (entry) => !isConsumerBuildArtifact(entry.split(sep).at(-1))
  });
}

/** Hash graph bytes and consumer source, never installed/build outputs. */
export async function artifactHashes(bundle) {
  const hashes = {};
  const walk = async (relative) => {
    for (const entry of (await readdir(join(bundle, relative), { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name)
    )) {
      if (isConsumerBuildArtifact(entry.name)) continue;
      const name = `${relative}/${entry.name}`;
      assert.ok(!entry.isSymbolicLink(), `Replay artifacts must not contain symlinks: ${name}`);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile())
        hashes[name] = createHash("sha256")
          .update(await readFile(join(bundle, name)))
          .digest("hex");
    }
  };
  await walk("packs");
  await walk("fixture");
  assert.ok(hashes["fixture/package.json"], "Missing retained fixture manifest");
  assert.ok(hashes["fixture/pnpm-lock.yaml"], "Missing retained lockfile");
  assert.ok(
    Object.keys(hashes).some((name) => /^packs\/[^/]+\.tgz$/.test(name)),
    "Missing retained package tarballs"
  );
  return hashes;
}
