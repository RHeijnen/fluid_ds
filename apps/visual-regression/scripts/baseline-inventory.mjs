import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
export const acceptedSnapshotDirectory = join(app, "__screenshots__", "catalog.spec.ts");
export const modes = ["light", "dark", "forced-colors", "rtl", "reduced-motion"];

export function expectedSnapshots(catalog) {
  return catalog.flatMap((fixture) =>
    modes
      .filter((mode) => mode === "light" || fixture.representative)
      .map((mode) => ({
        name: `${fixture.id}-${mode}.png`,
        fixtureId: fixture.id,
        mode,
        tags: [...fixture.tags]
      }))
  );
}

export function reconcileSnapshots(catalog, acceptedNames) {
  const expected = expectedSnapshots(catalog);
  const expectedNames = new Set(expected.map(({ name }) => name));
  const accepted = new Set(acceptedNames);
  const missing = expected.filter(({ name }) => !accepted.has(name));
  const orphaned = [...accepted].filter((name) => !expectedNames.has(name)).sort();
  const missingTags = [...new Set(missing.flatMap(({ tags }) => tags))].sort();
  return {
    storyCount: catalog.length,
    representativeCount: catalog.filter(({ representative }) => representative).length,
    attributedTagCount: new Set(catalog.flatMap(({ tags }) => tags)).size,
    expectedCount: expected.length,
    acceptedCount: [...accepted].filter((name) => expectedNames.has(name)).length,
    missingCount: missing.length,
    orphanedCount: orphaned.length,
    missing,
    missingTags,
    orphaned
  };
}

export async function readGeneratedCatalog(filename = join(app, ".generated", "catalog.ts")) {
  const source = await readFile(filename, "utf8");
  const json = source.replace(/^.*?=\s*/s, "").replace(/\s+as const;\s*$/, "");
  return JSON.parse(json);
}

export async function inventory() {
  const catalog = await readGeneratedCatalog();
  const entries = await readdir(acceptedSnapshotDirectory, { withFileTypes: true });
  return reconcileSnapshots(
    catalog,
    entries.filter((entry) => entry.isFile() && entry.name.endsWith(".png")).map(({ name }) => name)
  );
}

export async function hashFiles(root) {
  const results = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        const bytes = await readFile(path);
        results.push({
          path: relative(root, path).replaceAll("\\", "/"),
          bytes: (await stat(path)).size,
          sha256: createHash("sha256").update(bytes).digest("hex")
        });
      }
    }
  }
  await visit(root);
  return results.sort((left, right) => left.path.localeCompare(right.path));
}

async function main() {
  const result = await inventory();
  console.log(JSON.stringify(result, null, 2));
  if (result.attributedTagCount !== 155 || result.missingCount !== 60) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
