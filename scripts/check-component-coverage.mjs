/**
 * Component coverage check.
 *
 * Enforces the rule that every component shipped in @fluid-ds/components
 * has ALL THREE:
 *   1. A `*.stories.ts` file next to its source: so Storybook documents it.
 *   2. An appearance in the playground's preview pane: so the theme builder
 *      lets you style it visually.
 *   3. A docs `.mdx` page under apps/docs/src/content/docs/components/:
 *      so the website documents it. (One page per component directory; a
 *      page covers the whole family, e.g. dropdown.mdx covers
 *      fluid-dropdown + fluid-dropdown-item.)
 *
 * This is the machine-checkable half of the component-authoring standard
 * (see .claude/skills/component-authoring/SKILL.md). Run via
 * `pnpm check:coverage`. Wired into `pnpm verify` so a missing entry fails
 * the build, not the reviewer's attention.
 *
 * Heuristics:
 *   - Tags are discovered from `define.ts` files via the pattern
 *     `customElements.define("fluid-foo", …)`.
 *   - The "card exists" check is a textual search for the tag name inside
 *     [apps/playground/src/preview.ts]. That's imperfect but catches
 *     accidental omissions, if a component is mentioned anywhere in
 *     preview.ts, we assume it's intentionally there.
 *   - The "docs page exists" check maps each component DIRECTORY to a
 *     same-named .mdx (button/ → button.mdx). Per-directory, not per-tag,
 *     so sub-components don't each need their own page.
 */
import { readdir, readFile, access } from "node:fs/promises";
import { dirname, join, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const componentsRoot = join(root, "packages/components/src/components");
const packagesRoot = join(root, "packages");
const previewFile = join(root, "apps/playground/src/preview.ts");
const docsComponentsDir = join(root, "apps/docs/src/content/docs/components");

const DEFINE_RE = /customElements\.define\(\s*["']([\w-]+)["']/g;

/**
 * Walk a components tree recursively for define.ts files, collecting every
 * custom element it registers.
 */
async function discoverIn(rootDir, pkg, components) {
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return; // package without a components tree
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        // A registration entry is either `define.ts` or any file inside a
        // `define/` directory (animations ships `src/define/celebrate.ts`).
      } else if (entry.name === "define.ts" || basename(dir) === "define") {
        const source = await readFile(full, "utf8");
        for (const match of source.matchAll(DEFINE_RE)) {
          components.push({ tag: match[1], defineFile: full, dir: dirname(full), pkg });
        }
      }
    }
  }
  await walk(rootDir);
}

/**
 * Every published custom element, core AND expansion packs.
 *
 * Scanning only `packages/components` used to hide the expansion packs
 * entirely: charts, table, parser, animations, map and friends could lose
 * their playground demo without this check noticing (fluid-celebrate,
 * fluid-chart and fluid-column-mapper all did exactly that).
 */
async function discoverComponents() {
  const components = [];
  await discoverIn(componentsRoot, "components", components);
  const packageDirs = await readdir(packagesRoot, { withFileTypes: true });
  for (const entry of packageDirs) {
    if (!entry.isDirectory() || entry.name === "components") continue;
    // Scan the whole `src`, not just `src/components`: some packs register
    // from `src/define.ts` (markdown, qr) or `src/define/<name>.ts`
    // (animations), and those elements would otherwise be invisible here.
    await discoverIn(join(packagesRoot, entry.name, "src"), entry.name, components);
  }
  return components;
}

/**
 * Does the component's folder contain a *.stories.ts? Could be named per-tag
 * or per-component-group (e.g. fluid-tabs/fluid-tabs.stories.ts covers tab
 * and tab-panel too).
 */
async function hasStorybookEntry(componentDir) {
  const files = await readdir(componentDir);
  return files.some((f) => f.endsWith(".stories.ts") || f.endsWith(".stories.mdx"));
}

/**
 * Is the tag actually authored in the preview?
 *
 * The match must end at a tag boundary. A plain `includes("<" + tag)` reports
 * `fluid-tab` as present merely because `<fluid-table` or `<fluid-tabs`
 * appears, so a genuinely missing element can pass. Only whitespace, `>` or
 * `/` may follow the name.
 */
async function isInPreview(previewSource, tag) {
  return new RegExp(`<${tag}(?=[\\s/>])`).test(previewSource);
}

/**
 * Does a docs page exist for this component directory? Maps the directory
 * basename to <name>.mdx under the docs components folder, e.g.
 * `…/components/button-group/` → `button-group.mdx`. One page per family.
 */
async function hasDocsPage(componentDir) {
  const page = join(docsComponentsDir, `${basename(componentDir)}.mdx`);
  try {
    await access(page);
    return true;
  } catch {
    return false;
  }
}

/**
 * Expansion packs document one page per PACK (docs/expansion/<pack>.mdx)
 * rather than one page per element, and their stories may cover several
 * elements from a single file. Check them at the level they are authored.
 */
async function hasPackDocsPage(pkg) {
  // `<pack>.mdx`, or a suffixed page for packs whose docs are scoped to one
  // aspect of the package (animations ships `animations-effects.mdx`).
  try {
    const pages = await readdir(join(root, "apps/docs/src/content/docs/expansion"));
    return pages.some((page) => page === `${pkg}.mdx` || page.startsWith(`${pkg}-`));
  } catch {
    return false;
  }
}

async function packHasAnyStory(pkg) {
  // Whole `src`: flat packs (markdown, qr) keep stories beside the component.
  const dir = join(packagesRoot, pkg, "src");
  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (await walk(full)) return true;
      } else if (entry.name.endsWith(".stories.ts") || entry.name.endsWith(".stories.mdx")) {
        return true;
      }
    }
    return false;
  }
  return walk(dir);
}

/**
 * Components that are intentionally exempt from the "must appear in preview"
 * rule. Two categories:
 *
 *  1. Internal sub-components composed by a parent that IS shown
 *     (option, segment, tab, tab-panel, details, toast-item).
 *  2. Non-visual / structural elements whose home is the docs site rather
 *     than the theme builder, layout primitives (page, split-panel,
 *     scroller), format helpers (format-bytes/number/date, relative-time),
 *     and observer wrappers (mutation/resize/intersection). They have no
 *     meaningful theme tokens to edit, so a card in the visual builder
 *     just adds noise.
 *
 * Coverage still requires a Storybook story for these tags, only the
 * preview-card requirement is waived.
 */
const PREVIEW_EXEMPT = new Set([
  // Internal sub-components.
  "fluid-option", // rendered as children of fluid-select
  "fluid-tab", // children of fluid-tabs
  "fluid-tab-panel", // children of fluid-tabs
  "fluid-segment", // children of fluid-segmented-control
  "fluid-step", // children of fluid-steps
  "fluid-details", // children of fluid-accordion (and the accordion is shown)
  "fluid-icon", // shown indirectly via fluid-icon usage inside fluid-button etc.
  "fluid-divider", // common layout primitive, not always its own card
  "fluid-toast-item", // created dynamically by fluid-toast.toast(); not authored directly

  // Non-visual / structural, documented in apps/docs, not in the builder.
  "fluid-page",
  "fluid-split-panel",
  "fluid-grid", // layout primitive, no theme tokens worth a builder card
  "fluid-col",
  "fluid-mosaic",
  "fluid-mosaic-item",
  "fluid-stack",
  "fluid-scroller",
  "fluid-include",
  "fluid-format-bytes",
  "fluid-format-number",
  "fluid-format-date",
  "fluid-relative-time",
  "fluid-mutation-observer",
  "fluid-resize-observer",
  "fluid-intersection-observer",
  "fluid-animation", // motion primitive, display:contents wrapper, no visual surface
  "fluid-hotkey", // non-visual keyboard-shortcut behavior wrapper, renders nothing
  "fluid-aspect-ratio", // layout primitive (constrains a box to a ratio), nothing to theme/preview
  "fluid-form" // non-visual form-coordination wrapper; slots native inputs and has no visual surface of its own
]);

/**
 * Component directories intentionally exempt from the "must have a docs
 * page" rule. Keyed by directory basename. Empty today, all 52
 * components ship a page, but kept as the documented escape hatch for a
 * future pure-internal helper that genuinely shouldn't have a standalone
 * page. Prefer writing a page over adding an entry here.
 */
const DOCS_EXEMPT = new Set([]);

async function main() {
  const components = await discoverComponents();
  if (!components.length) {
    console.error("No components discovered, is the path wrong?");
    process.exit(1);
  }
  const previewSource = await readFile(previewFile, "utf8");

  const missingStory = [];
  const missingPreview = [];
  const missingDocs = [];

  const core = components.filter((c) => c.pkg === "components");
  const packs = [...new Set(components.filter((c) => c.pkg !== "components").map((c) => c.pkg))];

  // EVERY published element must be demoed in the builder, core and expansion
  // packs alike. Scanning core only used to let a pack element silently lose
  // its demo (fluid-celebrate, fluid-chart and fluid-column-mapper all did).
  for (const { tag } of components) {
    if (!PREVIEW_EXEMPT.has(tag) && !(await isInPreview(previewSource, tag))) {
      missingPreview.push({ tag });
    }
  }

  // Core: a story per component directory.
  for (const { tag, dir } of core) {
    if (!(await hasStorybookEntry(dir))) {
      missingStory.push({ tag, dir });
    }
  }

  // Core docs are per-directory, not per-tag, dedupe the component dirs first
  // so a family with several tags (dropdown + dropdown-item) is checked once.
  const uniqueDirs = [...new Set(core.map((c) => c.dir))];
  for (const dir of uniqueDirs) {
    const name = basename(dir);
    if (DOCS_EXEMPT.has(name)) continue;
    if (!(await hasDocsPage(dir))) {
      missingDocs.push({ name, dir });
    }
  }

  // Expansion packs: one docs page and at least one story per pack.
  for (const pkg of packs) {
    if (!(await hasPackDocsPage(pkg))) {
      missingDocs.push({
        name: pkg,
        dir: join(packagesRoot, pkg),
        pack: true
      });
    }
    if (!(await packHasAnyStory(pkg))) {
      missingStory.push({ tag: `@fluid-ds/${pkg}`, dir: join(packagesRoot, pkg) });
    }
  }

  if (!missingStory.length && !missingPreview.length && !missingDocs.length) {
    console.log(
      `✓ Coverage OK, ${components.length} elements ` +
        `(${core.length} core / ${uniqueDirs.length} families, ${packs.length} expansion packs): ` +
        `every element is demoed in the playground, and stories and docs exist.`
    );
    return;
  }

  console.error("✗ Component coverage check failed.\n");
  if (missingStory.length) {
    console.error(`Missing Storybook stories (.stories.ts) in:`);
    for (const { tag, dir } of missingStory) {
      console.error(`  • ${tag}, add a stories file in ${relative(root, dir)}`);
    }
    console.error("");
  }
  if (missingPreview.length) {
    console.error(`Missing from playground preview ([apps/playground/src/preview.ts]):`);
    for (const { tag } of missingPreview) {
      console.error(
        `  • ${tag}, add a <fluid-card> with a <${tag}> demo, or extend PREVIEW_EXEMPT if internal`
      );
    }
    console.error("");
  }
  if (missingDocs.length) {
    console.error(`Missing docs page (apps/docs/src/content/docs/components/<name>.mdx):`);
    for (const { name, dir } of missingDocs) {
      console.error(
        `  • ${name}, add ${name}.mdx (see docs/component-doc-template.md), or extend DOCS_EXEMPT if internal (${relative(root, dir)})`
      );
    }
    console.error("");
  }
  console.error(
    "Fix above, or extend PREVIEW_EXEMPT / DOCS_EXEMPT in scripts/check-component-coverage.mjs."
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
