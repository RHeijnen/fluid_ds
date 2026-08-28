import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkManifestOutputs,
  expectedManifestOutputs,
  readRepositoryManifests
} from "./canonical.mjs";

const flags = process.argv.slice(2);
if (flags.some((flag) => flag !== "--check"))
  throw new Error("Usage: node scripts/cem/generate.mjs [--check]");
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const { records, registry } = await readRepositoryManifests(root);
const outputs = expectedManifestOutputs(records);
if (flags.includes("--check")) await checkManifestOutputs(root, outputs);
else for (const [path, bytes] of outputs) await writeFile(join(root, path), bytes, "utf8");
console.log(
  `${flags.includes("--check") ? "Verified" : "Generated"} ${outputs.size} canonical manifests for ${registry.length} registered elements.`
);
