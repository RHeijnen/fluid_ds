/**
 * Walk the sidebar definition in `astro.config.mjs` and write a stub MDX file
 * for every linked path that doesn't already exist. Stubs include
 * `<ComponentApi tag="…">` for component pages so the auto-generated tables
 * appear even before prose is written.
 *
 * Re-running this script is safe, existing files are left alone.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = join(HERE, "..", "src", "content", "docs");

/**
 * The set of paths we want to exist. Keep in sync with `astro.config.mjs`.
 * Anchor pages already written manually are listed too, generate-stubs
 * checks for existence and skips them.
 */
const PATHS = [
  // Getting started
  { path: "getting-started/installation", title: "Installation" },
  { path: "getting-started/first-component", title: "First component" },

  // Theming
  { path: "theming/basics", title: "Theming basics" },
  { path: "theming/brand", title: "Brand attribute" },
  { path: "theming/tokens", title: "Semantic vs component tokens" },
  { path: "theming/per-element", title: "Per-element overrides" },
  { path: "theming/dark-mode", title: "Dark mode" },

  // Components, one entry per fluid-* tag.
  ...components([
    "button",
    "input",
    "number-input",
    "textarea",
    "switch",
    "checkbox",
    "radio",
    "select",
    "typeahead",
    "slider",
    "color-picker",
    "rating",
    "file-input",
    "page",
    "card",
    "split-panel",
    "scroller",
    "divider",
    "carousel",
    "toast",
    "dialog",
    "drawer",
    "callout",
    "tooltip",
    "progress-bar",
    "progress-ring",
    "spinner",
    "skeleton",
    "tabs",
    "breadcrumb",
    "tree",
    "dropdown",
    "popover",
    "popup",
    "accordion",
    "segmented-control",
    "avatar",
    "badge",
    "tag",
    "icon",
    "copy-button",
    "code-block",
    "comparison",
    "include",
    "format-bytes",
    "format-number",
    "format-date",
    "relative-time",
    "mutation-observer",
    "resize-observer",
    "intersection-observer"
  ]),

  // Expansion packs.
  { path: "expansion/charts", title: "@fluid-ds/charts" },
  { path: "expansion/markdown", title: "@fluid-ds/markdown" },
  { path: "expansion/qr", title: "@fluid-ds/qr" },
  { path: "expansion/media", title: "@fluid-ds/media" },

  // Guides.
  { path: "guides/forms", title: "Forms" },
  { path: "guides/accessibility", title: "Accessibility model" },
  { path: "guides/frameworks", title: "Framework wrappers" },
  { path: "guides/ssr", title: "Server-side rendering" }
];

function components(names) {
  return names.map((name) => ({
    path: `components/${name}`,
    title: titleCase(name),
    componentTag: `fluid-${name}`
  }));
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Quote a YAML scalar so chars like @ : # don't trip the parser. */
function yamlString(s) {
  return `"${String(s).replace(/"/g, '\\"')}"`;
}

function stubContent({ title, componentTag }) {
  const titleY = yamlString(title);
  if (componentTag) {
    const descY = yamlString(`${componentTag}, component reference.`);
    return `---
title: ${titleY}
description: ${descY}
---

import ComponentApi from "../../../components/ComponentApi.astro";

\`<${componentTag}>\`, *write the overview paragraph here.*

## Examples

*Add examples for this component. Drop one or more \`<${componentTag}>\` instances
inside a \`<Demo>\` block.*

## API

<ComponentApi tag="${componentTag}" />
`;
  }
  const descY = yamlString(`${title}, write the description here.`);
  return `---
title: ${titleY}
description: ${descY}
---

*This page is a stub. Write the content.*
`;
}

async function main() {
  let created = 0;
  let skipped = 0;
  for (const entry of PATHS) {
    const file = join(DOCS_ROOT, `${entry.path}.mdx`);
    if (await exists(file)) {
      skipped += 1;
      continue;
    }
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, stubContent(entry), "utf8");
    created += 1;
  }
  console.log(`generate-stubs: ${created} created, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
