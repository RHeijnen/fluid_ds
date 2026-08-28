import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

export function assertRenderCatalog(registrations, components) {
  const tags = components.map(({ tag }) => tag);
  if (
    !tags.length ||
    tags.some((tag) => typeof tag !== "string" || !/^fluid-[a-z0-9-]+$/.test(tag))
  )
    throw new Error("SSR catalog must contain valid element tags");
  if (new Set(tags).size !== tags.length) throw new Error("Duplicate SSR catalog tags");
  const expected = new Set(tags);
  const missing = tags.filter((tag) => !registrations.has(tag));
  const extra = [...registrations].filter((tag) => !expected.has(tag));
  if (missing.length || extra.length)
    throw new Error(
      `SSR registration/catalog mismatch: missing ${missing.join(", ")}; extra ${extra.join(", ")}`
    );
}

function exportLeaves(value, path = "exports", result = []) {
  if (typeof value === "string") result.push({ exportPath: path, target: value });
  else if (value === null) result.push({ exportPath: path, target: null });
  else if (value && typeof value === "object")
    for (const [key, child] of Object.entries(value)) exportLeaves(child, `${path}/${key}`, result);
  else throw new Error(`Invalid export target at ${path}`);
  return result;
}

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", "coverage"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

/** Built target safety, not proof of packed Node export-condition resolution. */
export async function inventoryPublishedEntries(packageRoot, manifest) {
  const targets = exportLeaves(manifest.publishConfig?.exports ?? manifest.exports ?? {});
  for (const key of ["main", "module"]) {
    if (manifest[key]) targets.push({ exportPath: key, target: manifest[key] });
  }
  const files = (await filesUnder(packageRoot)).map((path) => ({
    path,
    target: `./${relative(packageRoot, path).split(sep).join("/")}`
  }));
  const javascript = new Set();
  const classified = [];
  for (const { exportPath, target } of targets) {
    if (target === null) {
      classified.push({ exportPath, target, kind: "blocked" });
      continue;
    }
    const absolute = resolve(packageRoot, target);
    const within = relative(resolve(packageRoot), absolute);
    if (!target.startsWith("./") || within.startsWith("..") || within.includes("node_modules"))
      throw new Error(`Unsafe SSR export target: ${target}`);
    const expression = new RegExp(
      `^${target
        .split("*")
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".+")}$`
    );
    const matches = files.filter((file) => expression.test(file.target));
    if (!matches.length) throw new Error(`SSR export target has no built files: ${target}`);
    const kind = /\.(?:mjs|cjs|js)$/.test(target)
      ? "javascript"
      : /\.d\.(?:ts|mts|cts)$/.test(target)
        ? "types"
        : /\.(?:ts|mts|cts)$/.test(target)
          ? "typescript-source-not-plain-node-certified"
          : /\.(?:css|json|md|svg)$/.test(target)
            ? "asset"
            : null;
    if (!kind) throw new Error(`Unclassified SSR export target: ${target}`);
    classified.push({ exportPath, target, kind, files: matches.length });
    if (kind === "javascript") for (const file of matches) javascript.add(file.path);
  }
  return { package: manifest.name, javascript: [...javascript].sort(), classified };
}

export async function inventoryWorkspaceEntries(packagesRoot) {
  const records = [];
  for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageRoot = join(packagesRoot, entry.name);
    const manifest = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    if (!manifest.private) records.push(await inventoryPublishedEntries(packageRoot, manifest));
  }
  if (!records.length) throw new Error("SSR package inventory cannot be empty");
  return records;
}
