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
import { isLeaf, primitives, semantics, type TokenLeaf } from "../src/tokens.js";

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

/** Turn `{color.brand.500}` into `var(--fluid-color-brand-500)`. */
function resolveValue(value: string): string {
  const match = REF_RE.exec(value.trim());
  if (!match || !match[1]) return value;
  return `var(${VAR_PREFIX}-${match[1].split(".").map(kebab).join("-")})`;
}

function emitBlock(selector: string, entries: Entry[], comment: string): string {
  const lines: string[] = [];
  lines.push(`/* ${comment} */`);
  lines.push(`/* Generated from src/tokens.ts, do not edit. */`);
  lines.push(`${selector} {`);
  for (const { cssVar, leaf } of entries) {
    const value = resolveValue(leaf.$value);
    lines.push(`  ${cssVar}: ${value};`);
  }
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

function buildManifest() {
  const primEntries = walk(primitives);
  const lightEntries = walk(semantics.light);
  const darkEntries = walk(semantics.dark);

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
      light: lightEntries.map(({ path, cssVar, leaf }) => ({
        path,
        cssVar,
        type: leaf.$type,
        value: leaf.$value,
        referencesPrimitive: REF_RE.test(leaf.$value)
      })),
      dark: darkEntries.map(({ path, cssVar, leaf }) => ({
        path,
        cssVar,
        type: leaf.$type,
        value: leaf.$value,
        referencesPrimitive: REF_RE.test(leaf.$value)
      }))
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
    "\n/* Opt-in AAA conformance (data-fluid-conformance=\"aaa\"), deltas only. */\n" +
    '[data-fluid-conformance="aaa"] {\n' +
    "  --fluid-target-min: 44px;\n" +
    "  --fluid-focus-ring-width: 3px;\n" +
    "}\n";
  await writeFile(
    resolve(dist, "base.css"),
    emitBlock(":root", primEntries, "Fluid, base tokens (primitives).") + aaaOverride
  );

  const lightEntries = walk(semantics.light);
  await writeFile(
    resolve(dist, "light.css"),
    emitBlock(
      `:root,\n:host,\n[data-fluid-theme="light"]`,
      lightEntries,
      "Fluid, light scheme semantic tokens."
    )
  );

  const darkEntries = walk(semantics.dark);
  await writeFile(
    resolve(dist, "dark.css"),
    emitBlock(`[data-fluid-theme="dark"]`, darkEntries, "Fluid, dark scheme semantic tokens.")
  );

  const manifest = buildManifest();
  await writeFile(resolve(dist, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    `tokens: built ${primEntries.length} primitives, ` +
      `${lightEntries.length} light + ${darkEntries.length} dark semantics → dist/`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
