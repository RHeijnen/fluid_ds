import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const report = JSON.parse(await readFile(join(root, "quality/component-quality.json"), "utf8"));
const file = join(root, "quality/maturity.json");
let existing = { components: {} };
try {
  existing = JSON.parse(await readFile(file, "utf8"));
} catch {
  // The first run seeds the manifest from the audited Storybook statuses.
}

const components = {};
for (const component of [...report.components].sort((a, b) => a.tag.localeCompare(b.tag))) {
  components[component.tag] = existing.components[component.tag] ?? {
    status: component.maturity,
    since: component.version,
    support: component.maturity === "stable" ? "supported" : "best-effort"
  };
}

const manifest = {
  schemaVersion: 1,
  statuses: {
    experimental: "API and behavior may change without a deprecation cycle.",
    beta: "API is settling; migration notes accompany breaking changes.",
    stable: "Covered by the public compatibility and deprecation policy.",
    deprecated: "Supported only through the documented removal window."
  },
  components
};
await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Synchronized maturity records for ${Object.keys(components).length} elements.`);
