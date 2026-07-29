/**
 * Phantom-token check.
 *
 * Every `var(--fluid-*)` (and JS `getPropertyValue("--fluid-*")`) reference in
 * shipped source must resolve to a token that actually exists. A "phantom"
 * token, one that is referenced but never defined, silently falls through to
 * its `var()` fallback or to nothing, so a themed surface renders the wrong
 * color with no error. This has bitten the design system repeatedly
 * (`--fluid-color-primary`, `--fluid-line-height-normal`, ...).
 *
 * The legitimate vocabulary is the union of:
 *   1. tokens DECLARED with a value (`--fluid-x: ...`) anywhere, the generated
 *      token CSS (`packages/tokens/dist`), the brand themes
 *      (`packages/themes`), and any component-local declarations;
 *   2. every component token annotated `@cssproperty --fluid-x` and every
 *      semantic var annotated `@uses-token --fluid-x` (the authoring standard
 *      requires these annotations, so an un-annotated token is itself a bug).
 *
 * Any referenced `--fluid-*` outside that set is reported. Run via
 * `pnpm check:tokens`; wired into `pnpm verify`.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** Recursively collect files under `dir` whose name passes `accept`. */
async function walk(dir, accept, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, accept, out);
    else if (accept(full)) out.push(full);
  }
  return out;
}

/** Tokens referenced via a constructed/interpolated name can't be checked
 *  statically and a handful of legitimately-dynamic or externally-defined
 *  tokens are allowlisted here with a reason. */
const ALLOW = new Set([
  // Leaflet/third-party or intentionally-host-provided escape hatches go here.
]);

const isCss = (f) => f.endsWith(".css");
const isTs = (f) => f.endsWith(".ts");

const TOKEN = "--fluid-[a-z0-9-]+";
const DECL_RE = new RegExp(`(${TOKEN})\\s*:`, "g");
const CSSPROP_RE = new RegExp(`@cssproperty\\s+(${TOKEN})`, "g");
const USESTOKEN_RE = new RegExp(`@uses-token\\s+(${TOKEN})`, "g");
// Capture the delimiter after the token: `)` means NO fallback (a bare
// reference that MUST resolve), `,` means it's a component knob with a fallback
// (safe even if undefined; its fallback, if itself a var(), is matched
// separately). We only require resolution for the must-resolve positions.
const VAR_RE = new RegExp(`var\\(\\s*(${TOKEN})\\s*([,)])`, "g");
const GETPROP_RE = new RegExp(`getPropertyValue\\(\\s*["'](${TOKEN})["']`, "g");

function collect(re, text, into) {
  for (const m of text.matchAll(re)) into.add(m[1]);
}

/**
 * Primitive / semantic token namespaces. A token in one of these tracks is NOT
 * a component knob, so a reference to one must ALWAYS resolve even when it has a
 * `var()` fallback, a typo here (e.g. `--fluid-color-primary`,
 * `--fluid-line-height-normal`) silently paints the fallback and ignores theme
 * overrides. Component tokens (every other `--fluid-*`) only need to resolve
 * when referenced bare (no fallback).
 */
const SEMANTIC_PREFIXES = [
  "--fluid-color-",
  "--fluid-accent-",
  "--fluid-success-",
  "--fluid-danger-",
  "--fluid-warning-",
  "--fluid-info-",
  "--fluid-surface-",
  "--fluid-text-",
  "--fluid-border-",
  "--fluid-space-",
  "--fluid-radius-",
  "--fluid-shadow-",
  "--fluid-font-",
  "--fluid-line-height-",
  "--fluid-z-",
  "--fluid-duration-",
  "--fluid-easing-",
  "--fluid-focus-ring-",
  "--fluid-target-",
  "--fluid-conformance-"
];
const isSemantic = (t) => SEMANTIC_PREFIXES.some((p) => t.startsWith(p));

/** Tokens that MUST resolve to a real definition: any bare `var()` (no
 *  fallback), any reference to a primitive/semantic namespace (even with a
 *  fallback), and every JS computed-style read. A trailing-dash name is a
 *  dynamic prefix built from a template literal, skip it. */
function collectRequired(text, into) {
  for (const m of text.matchAll(VAR_RE)) {
    const [, token, delim] = m;
    if (token.endsWith("-")) continue;
    if (delim === ")" || isSemantic(token)) into.add(token);
  }
  for (const m of text.matchAll(GETPROP_RE)) {
    if (!m[1].endsWith("-")) into.add(m[1]);
  }
}

async function main() {
  const vocab = new Set(ALLOW);

  // 1. Declared tokens: generated token CSS + brand themes.
  const cssFiles = [
    ...(await walk(join(root, "packages/tokens/dist"), isCss)),
    ...(await walk(join(root, "packages/themes/src"), isCss))
  ];
  for (const f of cssFiles) {
    const text = await readFile(f, "utf8");
    collect(DECL_RE, text, vocab);
  }

  // 2. Component sources: local declarations + @cssproperty/@uses-token annotations.
  const tsFiles = await walk(join(root, "packages"), isTs);
  const sourceFiles = tsFiles.filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".d.ts"));
  for (const f of sourceFiles) {
    const text = await readFile(f, "utf8");
    collect(DECL_RE, text, vocab);
    collect(CSSPROP_RE, text, vocab);
    collect(USESTOKEN_RE, text, vocab);
  }

  // 3. References: every var(--fluid-*) / getPropertyValue("--fluid-*").
  const violations = [];
  for (const f of sourceFiles) {
    const text = await readFile(f, "utf8");
    const refs = new Set();
    collectRequired(text, refs);
    for (const token of refs) {
      if (!vocab.has(token)) {
        violations.push({ file: relative(root, f), token });
      }
    }
  }

  if (!violations.length) {
    console.log(`✓ Token check OK, ${vocab.size} tokens in vocabulary, no phantom references.`);
    return;
  }

  // Group by token for a readable report.
  const byToken = new Map();
  for (const v of violations) {
    if (!byToken.has(v.token)) byToken.set(v.token, new Set());
    byToken.get(v.token).add(v.file);
  }
  console.error("✗ Phantom token references (referenced but never defined/annotated):\n");
  for (const [token, files] of [...byToken].sort()) {
    console.error(`  ${token}`);
    for (const file of [...files].sort()) console.error(`      ${file}`);
  }
  console.error(
    `\n${byToken.size} phantom token(s) across ${violations.length} reference(s).` +
      `\nFix: point at a real token, declare it, or annotate the component token` +
      ` with @cssproperty / the semantic var with @uses-token. Truly external` +
      ` tokens can be added to ALLOW in scripts/check-tokens.mjs.`
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
