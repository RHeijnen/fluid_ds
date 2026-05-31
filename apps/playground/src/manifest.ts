/**
 * Loads and groups the token manifest emitted by @fluid-ds/tokens.
 *
 * The manifest shape lives in packages/tokens/scripts/build.ts. We re-declare
 * the consumer-facing types here to avoid coupling the playground to the
 * tokens package's internals.
 */
import manifestJson from "@fluid-ds/tokens/manifest.json";

export type TokenType =
  | "color"
  | "dimension"
  | "duration"
  | "cubicBezier"
  | "fontFamily"
  | "fontWeight"
  | "number"
  | "shadow"
  | "string";

export interface TokenEntry {
  path: string[];
  cssVar: string;
  type: TokenType;
  value: string;
  description?: string;
  userFacing: boolean;
  range?: { min: number; max: number; step?: number; unit?: string };
}

export interface SemanticEntry {
  path: string[];
  cssVar: string;
  type: TokenType;
  value: string;
  referencesPrimitive: boolean;
}

export interface Manifest {
  version: number;
  primitives: TokenEntry[];
  semantics: {
    light: SemanticEntry[];
    dark: SemanticEntry[];
  };
}

export const manifest = manifestJson as unknown as Manifest;

export interface TokenGroup {
  key: string;
  label: string;
  /** When true, tokens here reference primitives, the builder should
   *  resolve their current value rather than treat them as standalone. */
  semantic?: boolean;
  tokens: TokenEntry[];
}

const GROUP_LABELS: Record<string, string> = {
  color: "Colors",
  font: "Typography",
  space: "Spacing",
  radius: "Radii",
  duration: "Motion",
  easing: "Easing",
  shadow: "Elevation",
  focusRing: "Focus ring"
};

/**
 * Group the user-facing primitives by their top-level category so the form
 * generator can render one section per group.
 */
export function groupUserFacingPrimitives(): TokenGroup[] {
  const groups = new Map<string, TokenEntry[]>();
  for (const token of manifest.primitives) {
    if (!token.userFacing) continue;
    const groupKey = token.path[0] ?? "misc";
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(token);
  }
  return Array.from(groups.entries()).map(([key, tokens]) => ({
    key,
    label: GROUP_LABELS[key] ?? key,
    tokens
  }));
}

/**
 * Lookup a primitive token by its cssVar. Used to resolve semantic-token
 * references to a concrete starting value for the builder UI.
 */
export function findPrimitive(cssVar: string): TokenEntry | undefined {
  return manifest.primitives.find((t) => t.cssVar === cssVar);
}

/**
 * Resolve a semantic token's value to a concrete one by following its
 * `{primitive.path}` reference. Returns the raw value if the reference
 * can't be resolved.
 */
export function resolveSemanticValue(rawValue: string): string {
  const match = /^\{([^}]+)\}$/.exec(rawValue.trim());
  if (!match || !match[1]) return rawValue;
  const path = match[1].split(".");
  const cssVar = `--fluid-${path.map(kebab).join("-")}`;
  return findPrimitive(cssVar)?.value ?? rawValue;
}

function kebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * The semantic tokens of the active scheme, packaged as TokenEntry[] so the
 * existing <token-control> can render them. References are pre-resolved to
 * concrete values so the color picker has something to show.
 */
export function groupSemanticTokens(scheme: "light" | "dark" = "light"): TokenGroup {
  const tokens: TokenEntry[] = manifest.semantics[scheme].map((s) => ({
    path: s.path,
    cssVar: s.cssVar,
    type: s.type,
    value: s.referencesPrimitive ? resolveSemanticValue(s.value) : s.value,
    userFacing: true
  }));
  return {
    key: `semantic-${scheme}`,
    label: `Semantic (${scheme})`,
    semantic: true,
    tokens
  };
}
