/**
 * Token build script.
 *
 * Reads src/tokens.ts and emits to dist/:
 *   - base.css       CSS custom properties for every primitive
 *   - light.css      Semantic tokens for the light scheme (also default)
 *   - dark.css       Semantic tokens for the dark scheme
 *   - manifest.json  Structured token tree for the theme builder
 *
 * Run with: pnpm --filter @fluid-ds/tokens build
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { conformance, isLeaf, primitives, semantics, type TokenLeaf } from "../src/tokens.js";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist");

const VAR_PREFIX = "--fluid";

interface Entry {
  path: string[];
  cssVar: string;
  leaf: TokenLeaf;
}

function kebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function walk(node: unknown, path: string[] = [], out: Entry[] = []): Entry[] {
  if (isLeaf(node)) {
    out.push({ path, cssVar: `${VAR_PREFIX}-${path.map(kebab).join("-")}`, leaf: node });
    return out;
  }
  if (typeof node !== "object" || node === null) return out;
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue; // metadata, not a child
    walk(value, [...path, key], out);
  }
  return out;
}

const REF_RE = /^\{([^}]+)\}$/;
const REF_ALL_RE = /\{([^}]+)\}/g;

/**
 * Turn `{color.brand.500}` into `var(--fluid-color-brand-500)`. References may
 * also be embedded in a larger expression (a `color-mix()`, for instance), so
 * every `{…}` in the value is substituted, not just a whole-string reference.
 */
function resolveValue(value: string): string {
  return value.replace(
    REF_ALL_RE,
    (_, path: string) => `var(${VAR_PREFIX}-${path.split(".").map(kebab).join("-")})`
  );
}

function emitBlock(
  selector: string,
  entries: Entry[],
  comment: string,
  declarations: string[] = []
): string {
  const lines: string[] = [];
  lines.push(`/* ${comment} */`);
  lines.push(`/* Generated from src/tokens.ts, do not edit. */`);
  lines.push(`${selector} {`);
  for (const { cssVar, leaf } of entries) {
    const value = resolveValue(leaf.$value);
    lines.push(`  ${cssVar}: ${value};`);
  }
  for (const declaration of declarations) lines.push(`  ${declaration}`);
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

/**
 * The AAA contrast block for one scheme.
 *
 * `conformance.aaa.<scheme>` lists only the tokens that miss 7:1, but the
 * emitted block declares the UNION of both schemes' deltas, filling the gaps
 * from that scheme's own semantics. Without that, a light-scheme AAA value (a
 * deep emerald success fill, say) would still apply inside a dark AAA subtree
 * that had no delta of its own, and paint dark text on a dark fill. The main
 * light / dark blocks dodge the same trap by declaring every semantic token.
 */
function aaaEntries(scheme: "light" | "dark"): Entry[] {
  const union = new Set(
    [...walk(conformance.aaa.light), ...walk(conformance.aaa.dark)].map((e) => e.cssVar)
  );
  const deltas = new Map(walk(conformance.aaa[scheme]).map((e) => [e.cssVar, e]));
  return walk(semantics[scheme])
    .filter((e) => union.has(e.cssVar))
    .map((e) => deltas.get(e.cssVar) ?? e);
}

function buildManifest() {
  const primEntries = walk(primitives);
  const lightEntries = walk(semantics.light);
  const darkEntries = walk(semantics.dark);
  const describe = ({ path, cssVar, leaf }: Entry) => ({
    path,
    cssVar,
    type: leaf.$type,
    value: leaf.$value,
    referencesPrimitive: REF_RE.test(leaf.$value)
  });

  return {
    version: 1,
    primitives: primEntries.map(({ path, cssVar, leaf }) => ({
      path,
      cssVar,
      type: leaf.$type,
      value: leaf.$value,
      description: leaf.$description,
      userFacing: leaf.$userFacing ?? false,
      range: leaf.$range
    })),
    semantics: {
      light: lightEntries.map(describe),
      dark: darkEntries.map(describe)
    },
    /** Opt-in AAA (SC 1.4.6) deltas, the tokens that move at 7:1. */
    conformance: {
      aaa: {
        light: walk(conformance.aaa.light).map(describe),
        dark: walk(conformance.aaa.dark).map(describe)
      }
    }
  };
}

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  const primEntries = walk(primitives);
  // Opt-in AAA conformance: re-declares only the deltas (SC 2.5.5 target size,
  // SC 2.4.13 focus appearance) and composes with theme + brand. Components
  // read --fluid-target-min / --fluid-focus-ring-width and never branch on
  // conformance themselves. See accessibility/references/conformance-levels.md.
  const aaaOverride =
    '\n/* Opt-in AAA conformance (data-fluid-conformance="aaa"), deltas only. */\n' +
    '[data-fluid-conformance="aaa"] {\n' +
    "  --fluid-target-min: 44px;\n" +
    "  --fluid-focus-ring-width: 3px;\n" +
    "}\n";
  const motionOverride =
    "\n/* Global motion scalar and automatic reduced-motion duration collapse. */\n" +
    ":root { --fluid-motion: 1; }\n" +
    "@media (prefers-reduced-motion: reduce) {\n" +
    "  :root {\n" +
    "    --fluid-motion: 0;\n" +
    "    --fluid-duration-fast: 0.01ms;\n" +
    "    --fluid-duration-normal: 0.01ms;\n" +
    "    --fluid-duration-slow: 0.01ms;\n" +
    "    --fluid-duration-slower: 0.01ms;\n" +
    "  }\n" +
    "}\n";
  await writeFile(
    resolve(dist, "base.css"),
    emitBlock(":root", primEntries, "Fluid, base tokens (primitives).") +
      aaaOverride +
      motionOverride
  );

  const lightEntries = walk(semantics.light);
  /*
   * The AAA contrast track (SC 1.4.6) rides along with the scheme it retunes,
   * so every selector here names a scheme. That matters because
   * `data-fluid-conformance` can sit on a region rather than on <html>: a bare
   * `[data-fluid-conformance="aaa"]` block would paint light-scheme fills onto
   * an AAA region inside a dark page, under text that inherited the dark
   * scheme, which is the one outcome worse than not upgrading at all. The
   * descendant form covers a region that inherits its scheme from an ancestor;
   * the `:root:not([data-fluid-theme="dark"])` form is the "nobody named a
   * scheme, so it is light" case, which the dark media block below out-ranks
   * when the reader prefers dark.
   */
  const lightAaa = emitBlock(
    [
      `:root[data-fluid-conformance="aaa"]`,
      `[data-fluid-theme="light"][data-fluid-conformance="aaa"]`,
      `[data-fluid-theme="light"] [data-fluid-conformance="aaa"]`,
      `:root:not([data-fluid-theme="dark"]) [data-fluid-conformance="aaa"]`
    ].join(",\n"),
    aaaEntries("light"),
    "Fluid, opt-in AAA contrast (SC 1.4.6, 7:1 normal text), light scheme."
  );
  await writeFile(
    resolve(dist, "light.css"),
    emitBlock(
      `:root,\n:host,\n[data-fluid-theme="light"]`,
      lightEntries,
      "Fluid, light scheme semantic tokens.",
      ["color-scheme: light;"]
    ) +
      "\n" +
      lightAaa
  );

  const darkEntries = walk(semantics.dark);
  const automaticDark = emitBlock(
    `:root:not([data-fluid-theme="light"]),\n:host(:not([data-fluid-theme="light"]))`,
    darkEntries,
    "Fluid, automatic dark scheme from the operating-system preference.",
    ["color-scheme: dark;"]
  );
  const explicitDark = emitBlock(
    `[data-fluid-theme="dark"]`,
    darkEntries,
    "Fluid, explicit dark scheme semantic tokens.",
    ["color-scheme: dark;"]
  );
  /*
   * The dark AAA blocks mirror the light one selector for selector, and have to
   * out-rank it wherever dark is in force. Explicit dark wins on source order at
   * equal specificity; the automatic pair carries a third attribute selector so
   * it also beats the light block's "nobody named a scheme" rule, while its
   * `:not([data-fluid-theme="light"])` anchor keeps it away from a region that
   * sits inside an explicitly light subtree.
   */
  const darkAaaSelectors = [
    `[data-fluid-theme="dark"][data-fluid-conformance="aaa"]`,
    `[data-fluid-theme="dark"] [data-fluid-conformance="aaa"]`
  ].join(",\n");
  const automaticDarkAaa = emitBlock(
    [
      `:root:not([data-fluid-theme="light"])[data-fluid-conformance="aaa"]`,
      `:root:not([data-fluid-theme="light"]) [data-fluid-conformance="aaa"]`
    ].join(",\n"),
    aaaEntries("dark"),
    "Fluid, AAA contrast under the automatic dark scheme."
  );
  const explicitDarkAaa = emitBlock(
    darkAaaSelectors,
    aaaEntries("dark"),
    "Fluid, AAA contrast, explicit dark scheme."
  );
  await writeFile(
    resolve(dist, "dark.css"),
    `@media (prefers-color-scheme: dark) {\n${automaticDark}\n${automaticDarkAaa}}\n\n` +
      `${explicitDark}\n${explicitDarkAaa}`
  );

  const manifest = buildManifest();
  await writeFile(resolve(dist, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    `tokens: built ${primEntries.length} primitives, ` +
      `${lightEntries.length} light + ${darkEntries.length} dark semantics, ` +
      `${aaaEntries("light").length} AAA contrast overrides per scheme → dist/`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
