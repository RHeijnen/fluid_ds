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
const previewFile = join(root, "apps/playground/src/preview.ts");
const docsComponentsDir = join(root, "apps/docs/src/content/docs/components");

const DEFINE_RE = /customElements\.define\(\s*["']([\w-]+)["']/g;

/**
 * Walk packages/components/src/components recursively for define.ts files.
 * Returns an array of { tag, defineFile, dir }.
 */
async function discoverComponents() {
  const components = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.name === "define.ts") {
        const source = await readFile(full, "utf8");
        for (const match of source.matchAll(DEFINE_RE)) {
          components.push({ tag: match[1], defineFile: full, dir: dirname(full) });
        }
      }
    }
  }
  await walk(componentsRoot);
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

async function isInPreview(previewSource, tag) {
  return previewSource.includes(`<${tag}`) || previewSource.includes(`'${tag}'`);
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
  "fluid-aspect-ratio" // layout primitive (constrains a box to a ratio), nothing to theme/preview
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

  for (const { tag, dir } of components) {
    if (!(await hasStorybookEntry(dir))) {
      missingStory.push({ tag, dir });
    }
    if (!PREVIEW_EXEMPT.has(tag) && !(await isInPreview(previewSource, tag))) {
      missingPreview.push({ tag });
    }
  }

  // Docs are per-directory, not per-tag, dedupe the component dirs first
  // so a family with several tags (dropdown + dropdown-item) is checked once.
  const uniqueDirs = [...new Set(components.map((c) => c.dir))];
  for (const dir of uniqueDirs) {
    const name = basename(dir);
    if (DOCS_EXEMPT.has(name)) continue;
    if (!(await hasDocsPage(dir))) {
      missingDocs.push({ name, dir });
    }
  }

  if (!missingStory.length && !missingPreview.length && !missingDocs.length) {
    console.log(
      `✓ Coverage OK, ${components.length} components / ${uniqueDirs.length} families: all have stories, preview cards, and docs pages.`
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
