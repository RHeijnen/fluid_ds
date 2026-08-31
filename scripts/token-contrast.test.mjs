/**
 * Token contrast gate (WCAG 2.2 SC 1.4.3 AA and SC 1.4.6 AAA).
 *
 * Tokens are upstream of every component, so a color pair that encodes a
 * contrast failure propagates to the whole catalog at once. This test reads the
 * CSS that actually ships (`@fluid-ds/tokens/dist` plus every brand preset in
 * `@fluid-ds/themes`), replays the cascade for each brand / scheme /
 * conformance combination the way a browser would, resolves each text-bearing
 * pair down to a hex, and computes the normative WCAG 2 ratio.
 *
 * Two directions are guarded:
 *
 *   - Under `[data-fluid-conformance="aaa"]` every normal-text pair must reach
 *     7.0:1 (SC 1.4.6). That is the promise the conformance switch makes.
 *   - Without it, every pair must reach 4.5:1 (SC 1.4.3), EXCEPT the frozen
 *     list of pre-existing gaps below. The list is asserted to be exact, so a
 *     new AA regression fails, and so does leaving a stale entry behind after
 *     one is fixed.
 *
 * Only the WCAG 2 relative-luminance formula gates anything here; APCA / WCAG 3
 * Lc values are not normative and must not be substituted.
 *
 * Run via `pnpm check:tokens`. Requires `pnpm build` to have produced
 * `packages/tokens/dist`.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const TOKEN_FILES = [
  "packages/tokens/dist/base.css",
  "packages/tokens/dist/light.css",
  "packages/tokens/dist/dark.css"
];
/** `default` is the built-in ramp, i.e. no `data-fluid-brand` attribute. */
const BRANDS = ["default", "midnight", "corporate", "titanium", "glass", "orchid"];

/**
 * The four ways a scheme can be reached. Explicit dark under an OS that
 * prefers light exercises the attribute blocks on their own; system dark
 * exercises the `prefers-color-scheme` blocks on their own. A value that only
 * lands on one path is a leak, and shows up as a failure here.
 */
const CONTEXTS = [
  { name: "light", theme: "light", osDark: false },
  { name: "light (system)", theme: undefined, osDark: false },
  { name: "dark", theme: "dark", osDark: false },
  { name: "dark (system)", theme: undefined, osDark: true }
];

/**
 * Where `data-fluid-conformance` sits. `root` puts it on `<html>` beside the
 * theme and brand attributes, which is what the docs toggle does. `region`
 * puts it on a descendant instead, the other documented shape
 * (`<section data-fluid-conformance="aaa">`), where the element has to pick up
 * its scheme and brand by inheritance.
 */
const PLACEMENTS = ["root", "region"];

/**
 * Every pair a component can put normal-weight text on. Interaction states are
 * included because a hovered or pressed control still carries its label: a
 * ladder that only fixes the resting fill is not conformant.
 */
const TONES = ["accent", "neutral", "success", "danger", "warning", "info"];
const PAIRS = [
  ...["primary", "secondary"].flatMap((text) =>
    ["base", "subtle", "muted"].map((surface) => ({
      label: `text-${text} on surface-${surface}`,
      fg: `--fluid-text-${text}`,
      bg: `--fluid-surface-${surface}`
    }))
  ),
  ...TONES.flatMap((tone) =>
    ["base", "hover", "active"].map((state) => ({
      label: `${tone}-text on ${tone}-${state}`,
      fg: `--fluid-${tone}-text`,
      bg: `--fluid-${tone}-${state}`
    }))
  )
];

const AA_MIN = 4.5;
const AAA_MIN = 7;

/**
 * Contrast pairs that already fail SC 1.4.3 at the default AA conformance
 * level, frozen so the gate can run without hiding them. Each is a real defect
 * to fix in its own change, not an accepted value; the opt-in AAA track above
 * already corrects every one of them. The assertion below requires this list
 * to match the measured failures EXACTLY, so fixing one without pruning its
 * entry fails just as loudly as introducing a new one.
 *
 *   - `info-base` (light): white on sky.600 is 4.10:1, in every brand that
 *     does not regrade the sky ramp.
 *   - `warning-active` (light): neutral.950 on amber.700 is 3.96:1.
 *   - corporate `accent-base` (dark): neutral.950 on slate.500 is 4.18:1.
 *   - titanium light `warning-*`: the gunmetal ramp it borrows for amber is
 *     far too dark for the dark warning text.
 *   - titanium dark `accent/success/warning/info`: the brand block declares
 *     the grayed tones without a dark-scheme re-derivation, so light-scheme
 *     steps apply in dark and land near-black text on a near-black fill. This
 *     is the worst of the set (down to 1.09:1) and wants a dedicated fix. The
 *     system-dark path escapes most of it, because the automatic dark block
 *     out-ranks the brand block there, which is why the two dark contexts
 *     carry different entries.
 */
const KNOWN_AA_GAPS = new Map([
  ["default/light: warning-text on warning-active", 3.96],
  ["default/light: info-text on info-base", 4.1],
  ["default/light (system): warning-text on warning-active", 3.96],
  ["default/light (system): info-text on info-base", 4.1],
  ["midnight/light: warning-text on warning-active", 3.96],
  ["midnight/light: info-text on info-base", 4.1],
  ["midnight/light (system): warning-text on warning-active", 3.96],
  ["midnight/light (system): info-text on info-base", 4.1],
  ["corporate/light: warning-text on warning-active", 3.96],
  ["corporate/light: info-text on info-base", 4.1],
  ["corporate/light (system): warning-text on warning-active", 3.96],
  ["corporate/light (system): info-text on info-base", 4.1],
  ["corporate/dark: accent-text on accent-base", 4.18],
  ["corporate/dark (system): accent-text on accent-base", 4.18],
  ["titanium/light: warning-text on warning-base", 3.55],
  ["titanium/light: warning-text on warning-hover", 1.94],
  ["titanium/light: warning-text on warning-active", 1.52],
  ["titanium/light (system): warning-text on warning-base", 3.55],
  ["titanium/light (system): warning-text on warning-hover", 1.94],
  ["titanium/light (system): warning-text on warning-active", 1.52],
  ["titanium/dark: accent-text on accent-base", 3.55],
  ["titanium/dark: success-text on success-base", 1.52],
  ["titanium/dark: success-text on success-hover", 1.25],
  ["titanium/dark: success-text on success-active", 1.09],
  ["titanium/dark: warning-text on warning-base", 3.55],
  ["titanium/dark: warning-text on warning-hover", 1.94],
  ["titanium/dark: warning-text on warning-active", 1.52],
  ["titanium/dark: info-text on info-base", 1.94],
  ["titanium/dark: info-text on info-hover", 1.52],
  ["titanium/dark: info-text on info-active", 1.25],
  ["titanium/dark (system): accent-text on accent-base", 3.55],
  ["titanium/dark (system): success-text on success-base", 3.55],
  ["titanium/dark (system): info-text on info-base", 3.55],
  ["glass/light: accent-text on accent-base", 4.1],
  ["glass/light: warning-text on warning-active", 3.96],
  ["glass/light: info-text on info-base", 4.1],
  ["glass/light (system): accent-text on accent-base", 4.1],
  ["glass/light (system): warning-text on warning-active", 3.96],
  ["glass/light (system): info-text on info-base", 4.1],
  ["orchid/light: warning-text on warning-active", 3.96],
  ["orchid/light: info-text on info-base", 4.1],
  ["orchid/light (system): warning-text on warning-active", 3.96],
  ["orchid/light (system): info-text on info-base", 4.1]
]);

/* ── CSS reading ────────────────────────────────────────────────────────── */

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Flatten a stylesheet into `{ selector, decls, media, order, index }` rules,
 * descending one level into `@media` so the scheme-preference blocks are kept
 * with their condition. Only custom-property declarations are collected.
 */
function parseRules(css, order, out = [], media = null) {
  const text = stripComments(css);
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open === -1) break;
    const prelude = text.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") depth--;
      j++;
    }
    const body = text.slice(open + 1, j - 1);
    if (prelude.startsWith("@media")) {
      parseRules(body, order, out, prelude.slice("@media".length).trim());
    } else if (!prelude.startsWith("@")) {
      const decls = [...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((m) => ({
        prop: m[1],
        value: m[2].trim()
      }));
      if (decls.length) {
        for (const selector of prelude
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)) {
          out.push({ selector, decls, media, order, index: out.length });
        }
      }
    }
    i = j;
  }
  return out;
}

/* ── Cascade ────────────────────────────────────────────────────────────── */

const SELECTOR_TOKEN =
  /#[\w-]+|\.[\w-]+|\[[^\]]*\]|::[\w-]+|:[\w-]+(?:\(([^()]*(?:\([^()]*\)[^()]*)*)\))?|\*|[\w-]+/g;

/** Selector specificity as [id, class-ish, element], per CSS Selectors 4. */
function specificity(selector) {
  let a = 0;
  let b = 0;
  let c = 0;
  for (const match of selector.matchAll(SELECTOR_TOKEN)) {
    const token = match[0];
    if (token.startsWith("#")) a++;
    else if (token.startsWith("::")) c++;
    else if (token.startsWith(":")) {
      const name = token.slice(1).split("(")[0].toLowerCase();
      if (name === "where") continue;
      if (match[1] !== undefined && ["not", "is", "has"].includes(name)) {
        const inner = match[1]
          .split(",")
          .map((part) => specificity(part.trim()))
          .sort((x, y) => compare(y, x))[0] ?? [0, 0, 0];
        a += inner[0];
        b += inner[1];
        c += inner[2];
      } else b++;
    } else if (token.startsWith(".") || token.startsWith("[")) b++;
    else if (token !== "*") c++;
  }
  return [a, b, c];
}

const compare = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];

/**
 * Match a selector against the single root element that carries the theme,
 * brand and conformance attributes, which is how the system is documented to
 * be used (`<html data-fluid-theme=… data-fluid-brand=… >`). Descendant forms
 * cannot match one element and are rejected; `:host` addresses a shadow host
 * rather than this element, and custom properties inherit into shadow trees
 * anyway, so it is rejected too.
 */
/** Does one compound selector match one element's attributes? */
function matchesCompound(compound, attrs, isRoot) {
  if (compound.includes("::") || compound.startsWith(":host")) return false;
  let rest = compound;
  if (rest.startsWith(":root")) {
    if (!isRoot) return false;
    rest = rest.slice(":root".length);
  }
  for (const m of compound.matchAll(/:not\(\[([a-z-]+)="([^"]*)"\]\)/g)) {
    if (attrs[m[1]] === m[2]) return false;
  }
  rest = rest.replace(/:not\([^)]*\)/g, "");
  for (const m of rest.matchAll(/\[([a-z-]+)="([^"]*)"\]/g)) {
    if (attrs[m[1]] !== m[2]) return false;
  }
  return rest.replace(/\[[^\]]*\]/g, "").trim() === "";
}

/**
 * Match a selector against the element whose computed value we want, given the
 * chain from the root down to it. The chain is one element when every attribute
 * sits on `<html>`, and two when `data-fluid-conformance` scopes a region, which
 * is a documented usage. `:host` addresses a shadow host rather than an element
 * on this chain, and custom properties inherit into shadow trees anyway, so it
 * is rejected.
 */
function matches(selector, chain) {
  if (/[>+~]/.test(selector.replace(/\([^)]*\)/g, ""))) return false;
  const compounds = selector.split(/\s+(?![^(]*\))/).filter(Boolean);
  const self = chain[chain.length - 1];
  const isRoot = chain.length === 1;
  if (compounds.length === 1) return matchesCompound(compounds[0], self, isRoot);
  if (compounds.length === 2) {
    if (isRoot) return false; // nothing to be a descendant of
    return (
      matchesCompound(compounds[0], chain[0], true) && matchesCompound(compounds[1], self, false)
    );
  }
  return false;
}

/**
 * Winning declaration per custom property, for the last element of the chain.
 * Anything not declared on that element is inherited, so the chain is resolved
 * from the root down and each level starts from the level above.
 */
function buildScope(rules, chain, osDark, inherited = new Map()) {
  const winners = new Map(inherited);
  for (const rule of rules) {
    if (rule.media !== null) {
      if (!/prefers-color-scheme:\s*dark/.test(rule.media)) continue;
      if (!osDark) continue;
    }
    if (!matches(rule.selector, chain)) continue;
    const spec = specificity(rule.selector);
    for (const { prop, value } of rule.decls) {
      const prev = winners.get(prop);
      // A declaration on this element always beats a value inherited from an
      // ancestor, however specific the ancestor's selector was.
      const beats =
        !prev ||
        prev.inherited ||
        compare(spec, prev.spec) > 0 ||
        (compare(spec, prev.spec) === 0 &&
          (rule.order > prev.order || (rule.order === prev.order && rule.index > prev.index)));
      if (beats) winners.set(prop, { value, spec, order: rule.order, index: rule.index });
    }
  }
  return winners;
}

/** Re-tag a scope so its entries read as inherited by a descendant. */
const asInherited = (scope) =>
  new Map([...scope].map(([prop, entry]) => [prop, { ...entry, inherited: true }]));

/* ── Color ──────────────────────────────────────────────────────────────── */

function toRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3)
    h = h
      .split("")
      .map((ch) => ch + ch)
      .join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** WCAG 2 relative luminance. */
function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const NAMED = { white: "#ffffff", black: "#000000", transparent: null };

/**
 * Resolve a custom property to a hex, following `var()` chains and evaluating
 * the one function the token layer uses, `color-mix(in srgb, …)`. Mixing in
 * sRGB is a component-wise interpolation of the gamma-encoded channels, which
 * is what the spec defines for that color space; rounding to 8 bits here can
 * differ from the browser's float result by well under 0.01 of a ratio.
 */
function resolveToken(prop, scope, seen = new Set()) {
  if (seen.has(prop)) return null;
  const entry = scope.get(prop);
  return entry ? evaluate(entry.value, scope, new Set(seen).add(prop)) : null;
}

function evaluate(value, scope, seen) {
  const v = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v.toLowerCase();
  if (v.toLowerCase() in NAMED) return NAMED[v.toLowerCase()];
  const ref = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(v);
  if (ref) return resolveToken(ref[1], scope, seen);
  const mix = /^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/is.exec(v);
  if (mix) {
    const first = evaluate(mix[1], scope, seen);
    const second = evaluate(mix[3], scope, seen);
    if (!first || !second) return null;
    const weight = Number.parseFloat(mix[2]) / 100;
    const [a, b] = [toRgb(first), toRgb(second)];
    return toHex(a.map((channel, i) => channel * weight + b[i] * (1 - weight)));
  }
  return null;
}

/* ── Measurement ────────────────────────────────────────────────────────── */

function loadRules() {
  const missing = TOKEN_FILES.filter((f) => !existsSync(join(root, f)));
  assert.deepEqual(
    missing,
    [],
    `Generated token CSS is missing: ${missing.join(", ")}. Run \`pnpm build\` first.`
  );
  const rules = [];
  TOKEN_FILES.forEach((file, order) =>
    parseRules(readFileSync(join(root, file), "utf8"), order, rules)
  );
  const themes = new Map();
  for (const brand of BRANDS) {
    if (brand === "default") continue;
    themes.set(
      brand,
      parseRules(readFileSync(join(root, `packages/themes/src/${brand}.css`), "utf8"), 10)
    );
  }
  return { tokenRules: rules, themes };
}

/** Every measured pair, across brand x scheme path x placement x conformance. */
function measure() {
  const { tokenRules, themes } = loadRules();
  const rows = [];
  for (const brand of BRANDS) {
    const rules = brand === "default" ? tokenRules : [...tokenRules, ...themes.get(brand)];
    for (const context of CONTEXTS) {
      for (const placement of PLACEMENTS) {
        // A region placement only differs once conformance is switched on; at
        // the AA baseline there is no attribute to place, so it is the root run.
        const levels = placement === "region" ? ["aaa"] : [undefined, "aaa"];
        for (const conformance of levels) {
          const host = {
            "data-fluid-theme": context.theme,
            "data-fluid-brand": brand === "default" ? undefined : brand,
            "data-fluid-conformance": placement === "root" ? conformance : undefined
          };
          let scope = buildScope(rules, [host], context.osDark);
          if (placement === "region") {
            const region = { "data-fluid-conformance": conformance };
            scope = buildScope(rules, [host, region], context.osDark, asInherited(scope));
          }
          const where = placement === "region" ? `${context.name}, region` : context.name;
          for (const pair of PAIRS) {
            const fg = resolveToken(pair.fg, scope);
            const bg = resolveToken(pair.bg, scope);
            rows.push({
              key: `${brand}/${where}: ${pair.label}`,
              brand,
              context: where,
              aaa: conformance === "aaa",
              fg,
              bg,
              ratio: fg && bg ? contrast(fg, bg) : null
            });
          }
        }
      }
    }
  }
  return rows;
}

const rows = measure();
const round = (n) => Math.round(n * 100) / 100;
const describe = (row) => `${row.key} = ${row.fg} on ${row.bg}, ${round(row.ratio ?? 0)}:1`;

test("every token pair resolves to a color", () => {
  const unresolved = rows.filter((row) => row.ratio === null);
  assert.deepEqual(
    unresolved.map((row) => `${row.key} (fg=${row.fg}, bg=${row.bg})`),
    [],
    "A text pair did not resolve to a hex. A token was renamed, or a value uses syntax this test cannot evaluate."
  );
});

test("AAA conformance reaches 7:1 for normal text (SC 1.4.6)", () => {
  const failures = rows
    .filter((row) => row.aaa && row.ratio !== null && round(row.ratio) < AAA_MIN)
    .map(describe);
  assert.deepEqual(
    failures,
    [],
    `Pairs below ${AAA_MIN}:1 under [data-fluid-conformance="aaa"]. Move the token to the ` +
      `nearest step of its own ramp that clears 7:1, in packages/tokens/src/tokens.ts ` +
      `(conformance.aaa) or the brand's AAA block in packages/themes/src.`
  );
});

test("the AA baseline holds at 4.5:1, with an exact list of known gaps (SC 1.4.3)", () => {
  const measured = new Map(
    rows
      .filter((row) => !row.aaa && row.ratio !== null && round(row.ratio) < AA_MIN)
      .map((row) => [row.key, round(row.ratio)])
  );

  const introduced = [...measured].filter(([key]) => !KNOWN_AA_GAPS.has(key));
  assert.deepEqual(
    introduced.map(([key, ratio]) => `${key} = ${ratio}:1`),
    [],
    `New AA contrast failures. Fix the token pair, do not extend KNOWN_AA_GAPS.`
  );

  const fixed = [...KNOWN_AA_GAPS.keys()].filter((key) => !measured.has(key));
  assert.deepEqual(
    fixed,
    [],
    "These AA gaps now pass. Delete them from KNOWN_AA_GAPS so the list keeps shrinking."
  );

  const drifted = [...measured]
    .filter(([key, ratio]) => KNOWN_AA_GAPS.get(key) !== ratio)
    .map(([key, ratio]) => `${key}: recorded ${KNOWN_AA_GAPS.get(key)}:1, measured ${ratio}:1`);
  assert.deepEqual(drifted, [], "A known AA gap changed value. Update the recorded ratio.");
});

test("AAA changes only what it must, and never loosens a pair", () => {
  const byKey = new Map();
  for (const row of rows) {
    const bucket = byKey.get(row.key) ?? {};
    bucket[row.aaa ? "aaa" : "aa"] = row;
    byKey.set(row.key, bucket);
  }
  const loosened = [...byKey.values()]
    .filter(({ aa, aaa }) => aa?.ratio && aaa?.ratio && round(aaa.ratio) < round(aa.ratio))
    .map(({ aa, aaa }) => `${aa.key}: ${round(aa.ratio)}:1 at AA, ${round(aaa.ratio)}:1 at AAA`);
  assert.deepEqual(loosened, [], "Turning on AAA lowered a contrast ratio.");
});

test("summary", () => {
  const worst = new Map();
  for (const row of rows.filter((r) => r.aaa && r.ratio !== null)) {
    const key = `${row.brand}/${row.context}`;
    if (!worst.has(key) || row.ratio < worst.get(key).ratio) worst.set(key, row);
  }
  const lines = [...worst].map(
    ([key, row]) =>
      `  ${key.padEnd(26)} worst AAA pair ${round(row.ratio)}:1  (${row.key.split(": ")[1]})`
  );
  console.log(
    `Token contrast: ${rows.length} measurements over ${BRANDS.length} brands ` +
      `x ${CONTEXTS.length} scheme paths x 2 conformance levels.\n${lines.join("\n")}`
  );
});
