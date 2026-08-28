import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkManifestOutputs,
  expectedManifestOutputs,
  readRepositoryManifests
} from "./canonical.mjs";

if (process.argv.slice(2).some((flag) => flag !== "--check"))
  throw new Error("Usage: node scripts/cem/audit.mjs [--check]");
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const { records, registry } = await readRepositoryManifests(root);
const events = registry.flatMap((entry) => entry.events);
console.log(
  JSON.stringify(
    {
      packages: records.length,
      tags: registry.length,
      eventfulTags: registry.filter((entry) => entry.events.length).length,
      eventPairs: events.length,
      unknownDetails: events.filter((event) => event.type?.text === "CustomEvent<unknown>").length,
      generatedFilesWritten: 0
    },
    null,
    2
  )
);
if (process.argv.includes("--check"))
  await checkManifestOutputs(root, expectedManifestOutputs(records));
