import { access, readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const rootUrl = new URL("../", import.meta.url);
const defaultInventoryUrl = new URL("../quality/localization-owned-strings.json", import.meta.url);
const packagesUrl = new URL("../packages/", import.meta.url);

const allowedCatalogDispositions = new Set([
  "completed-bounded-contract",
  "completed-audited-migration",
  "completed-existing-contract",
  "reviewed-no-owned-candidate"
]);
const allowedSurfaceDispositions = new Set([
  "localized-runtime-covered",
  "open-runtime-migration",
  "blocked-on-structured-contract",
  "preserve-verbatim",
  "document-and-test-boundary",
  "integration-policy-required"
]);

export async function publishedTags() {
  const tags = [];
  for (const directory of await readdir(packagesUrl, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    let manifest;
    try {
      manifest = JSON.parse(
        await readFile(new URL(`${directory.name}/custom-elements.json`, packagesUrl), "utf8")
      );
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    for (const module of manifest.modules ?? []) {
      for (const declaration of module.declarations ?? []) {
        if (declaration.customElement && declaration.tagName) tags.push(declaration.tagName);
      }
    }
  }
  return [...new Set(tags)].sort();
}

async function pathExists(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.length || relativePath.includes("\\")) {
    return false;
  }
  try {
    await access(new URL(relativePath, rootUrl));
    return true;
  } catch {
    return false;
  }
}

export async function validateInventory(inventory, expectedTags) {
  expectedTags ??= await publishedTags();
  const errors = [];
  if (inventory.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!inventory.measurement?.includes("not an English-literal count")) {
    errors.push("measurement must reject raw English-literal counting as completeness");
  }

  const ownership = new Set(inventory.ownershipCategories ?? []);
  const requiredOwnership = [
    "internal",
    "configurable-default",
    "application-content",
    "native-browser",
    "dependency-ui",
    "non-user-text"
  ];
  for (const category of requiredOwnership) {
    if (!ownership.has(category)) errors.push(`missing ownership category: ${category}`);
  }

  const catalogTags = [];
  for (const group of inventory.catalogDispositions ?? []) {
    if (!allowedCatalogDispositions.has(group.disposition)) {
      errors.push(`invalid catalog disposition: ${group.disposition}`);
    }
    if (!group.meaning || group.meaning.length < 30) {
      errors.push(`${group.disposition}: missing limitation-aware meaning`);
    }
    if (!group.evidence?.length) errors.push(`${group.disposition}: missing audit evidence`);
    for (const evidence of group.evidence ?? []) {
      if (!(await pathExists(evidence)))
        errors.push(`${group.disposition}: missing evidence ${evidence}`);
    }
    const tags = group.tags ?? [];
    if (JSON.stringify(tags) !== JSON.stringify([...tags].sort())) {
      errors.push(`${group.disposition}: tags must be sorted`);
    }
    catalogTags.push(...tags);
  }
  const uniqueCatalogTags = [...new Set(catalogTags)].sort();
  if (uniqueCatalogTags.length !== catalogTags.length) errors.push("catalog tags must be unique");
  if (JSON.stringify(uniqueCatalogTags) !== JSON.stringify(expectedTags)) {
    errors.push("catalog dispositions must exactly cover published custom elements");
  }

  const ids = [];
  for (const record of inventory.surfaceRecords ?? []) {
    ids.push(record.id);
    if (!record.id || !/^[a-z0-9-]+$/.test(record.id)) errors.push("surface id is invalid");
    if (!ownership.has(record.ownership)) errors.push(`${record.id}: invalid ownership`);
    if (!allowedSurfaceDispositions.has(record.disposition)) {
      errors.push(`${record.id}: invalid surface disposition`);
    }
    if (!record.summary || record.summary.length < 40)
      errors.push(`${record.id}: summary is too thin`);
    if (!record.sources?.length) errors.push(`${record.id}: must name source files`);
    for (const source of record.sources ?? []) {
      if (!(await pathExists(source))) errors.push(`${record.id}: missing source ${source}`);
    }
    if (!record.evidence?.length) errors.push(`${record.id}: disposition needs evidence`);
    for (const evidence of record.evidence ?? []) {
      if (!(await pathExists(evidence))) errors.push(`${record.id}: missing evidence ${evidence}`);
    }
  }
  if (new Set(ids).size !== ids.length) errors.push("surface record ids must be unique");
  for (const category of requiredOwnership) {
    if (!(inventory.surfaceRecords ?? []).some((record) => record.ownership === category)) {
      errors.push(`no surface record demonstrates ownership category: ${category}`);
    }
  }
  if ((inventory.humanGates ?? []).length < 3) errors.push("human review gates are incomplete");
  return errors;
}

export async function readInventory(url = defaultInventoryUrl) {
  return JSON.parse(await readFile(url, "utf8"));
}

async function main() {
  const inventory = await readInventory();
  const errors = await validateInventory(inventory);
  if (errors.length) {
    console.error(`Localization ownership inventory has ${errors.length} error(s):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  const catalogCount = inventory.catalogDispositions.flatMap((group) => group.tags).length;
  console.log(
    `Localization ownership inventory is current: ${catalogCount} published elements, ` +
      `${inventory.surfaceRecords.length} disposition records, 6 ownership categories.`
  );
}

const invokedUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (invokedUrl === import.meta.url) await main();
