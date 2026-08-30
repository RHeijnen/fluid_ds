/**
 * SSR import-safety gate.
 *
 * Source registration modules must guard `customElements`, and every built
 * package entry/definition must be importable in plain Node without a DOM.
 * This is the minimum server contract required before framework renderers can
 * add declarative shadow DOM and hydration on top. The gate also renders every
 * published element so a new component cannot silently skip the SSR contract.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { coldImportAll } from "./ssr-cold-imports.mjs";
import { assertRenderCatalog, inventoryWorkspaceEntries } from "./ssr-entry-inventory.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesDir = join(root, "packages");

async function walk(dir, accept, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", "coverage", ".git"].includes(entry.name)) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) await walk(file, accept, out);
    else if (accept(file)) out.push(file);
  }
  return out;
}

const sourceFiles = await walk(
  packagesDir,
  (file) =>
    file.endsWith(".ts") &&
    !file.endsWith(".d.ts") &&
    !file.endsWith(".test.ts") &&
    !file.endsWith(".stories.ts")
);
const definitions = [];
const unguarded = [];
const publishedTags = new Set();
// Transparent controller elements intentionally render no shadow tree.
const noShadowTags = new Set(["fluid-celebrate"]);
for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  if (!source.includes("customElements.define")) continue;
  definitions.push(file);
  for (const match of source.matchAll(/customElements\.define\(\s*["'](fluid-[a-z0-9-]+)["']/g)) {
    publishedTags.add(match[1]);
  }
  if (
    source.includes("customElements.") &&
    !source.includes('typeof customElements !== "undefined"')
  ) {
    unguarded.push(relative(root, file));
  }
}
if (unguarded.length) {
  console.error("SSR-unsafe custom-element registration modules:");
  for (const file of unguarded) console.error(`  ${file}`);
  process.exit(1);
}
const catalog = JSON.parse(await readFile(join(root, "quality/component-quality.json"), "utf8"));
assertRenderCatalog(publishedTags, catalog.components);

const packageDirs = await readdir(packagesDir, { withFileTypes: true });
const imports = [];
const coldImportExempt = new Set();
for (const entry of packageDirs) {
  if (!entry.isDirectory()) continue;
  const dir = join(packagesDir, entry.name);
  const manifest = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
  // The Angular integration ships Angular partial-compilation output, which by
  // contract is linked by the consumer's Angular build and cannot execute in
  // bare Node (importing @angular/common at module scope demands the linker or
  // the JIT compiler). Its server story is Angular SSR, not plain-Node import,
  // so the cold-import gate does not apply to it.
  if (manifest.fluidIntegration === "angular") {
    coldImportExempt.add(dir);
    continue;
  }
  if (manifest.main?.endsWith(".js")) imports.push(join(dir, manifest.main));
  const dist = join(dir, "dist");
  try {
    imports.push(
      ...(await walk(
        dist,
        (file) =>
          file.endsWith("define.js") ||
          /[\\/]define[\\/][^\\/]+\.js$/.test(file) ||
          /[\\/]locales[\\/][^\\/]+\.js$/.test(file)
      ))
    );
  } catch (error) {
    // Pure-CSS/source-only packages do not have dist output.
    if (error.code !== "ENOENT") throw error;
  }
}

const coldEntries = [
  ...new Set([
    ...imports,
    join(root, "packages/components/dist/ssr.js"),
    join(root, "packages/components/dist/ssr-client.js")
  ])
];
const publishedEntries = await inventoryWorkspaceEntries(packagesDir);
for (const file of publishedEntries.flatMap((entry) => entry.javascript))
  if (
    !coldEntries.includes(file) &&
    ![...coldImportExempt].some((dir) => file.startsWith(`${dir}${sep}`))
  )
    coldEntries.push(file);
console.log("Published built-JavaScript cold-import inventory:");
for (const entry of publishedEntries) {
  console.log(`  ${entry.package}: ${entry.javascript.length} distinct JS targets`);
  for (const target of entry.classified.filter(
    (item) => item.kind === "typescript-source-not-plain-node-certified"
  ))
    console.log(`    Outside plain-Node JS certification: ${target.target} (${target.exportPath})`);
}
const coldResults = await coldImportAll(coldEntries.map((file) => pathToFileURL(file).href));
const coldFailures = coldResults.filter(({ status }) => status !== "passed");
if (coldFailures.length) {
  for (const failure of coldFailures) console.error(`${failure.url}: ${failure.error}`);
  throw new Error(`${coldFailures.length} cold Node imports failed`);
}

// Rendering intentionally uses Lit's SSR registry. It is separate from the
// fresh-process import checks above, which never preload the renderer or a DOM.
const { renderFluidToString } = await import(
  pathToFileURL(join(root, "packages/components/dist/ssr.js")).href
);
const { html } = await import("lit");
const { html: staticHtml, unsafeStatic } = await import("lit/static-html.js");
for (const file of new Set(imports)) await import(pathToFileURL(file).href);

const renderedButton = await renderFluidToString(
  html`<fluid-button>Rendered on the server</fluid-button>`
);
if (
  !renderedButton.includes('shadowrootmode="open"') ||
  !renderedButton.includes("Rendered on the server")
) {
  console.error("Lit SSR did not emit the expected declarative shadow DOM for fluid-button.");
  process.exit(1);
}

const renderedInput = await renderFluidToString(
  html`<fluid-input value="server" aria-label="Server input"></fluid-input>`
);
if (!renderedInput.includes('shadowrootmode="open"') || !renderedInput.includes("Server input")) {
  console.error("Lit SSR did not render the form-associated fluid-input contract.");
  process.exit(1);
}

const renderFailures = [];
for (const tag of [...publishedTags].sort()) {
  try {
    const staticTag = unsafeStatic(tag);
    const output = await renderFluidToString(staticHtml`<${staticTag}></${staticTag}>`);
    if (!output.includes(`<${tag}`)) {
      renderFailures.push(`${tag}: host element missing`);
    } else if (!noShadowTags.has(tag) && !output.includes('shadowrootmode="open"')) {
      renderFailures.push(`${tag}: declarative shadow root missing`);
    }
  } catch (error) {
    renderFailures.push(`${tag}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (renderFailures.length) {
  console.error(`SSR rendering failed for ${renderFailures.length} published elements:`);
  for (const failure of renderFailures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `✓ SSR import check OK: ${definitions.length} guarded registration-bearing source files, ` +
    `${coldEntries.length} isolated cold Node imports, ${publishedTags.size} elements rendered ` +
    `(${publishedTags.size - noShadowTags.size} with declarative shadow DOM).`
);
