/**
 * Per-component token catalog used by Design Mode to filter the sidebar.
 *
 * - **ownTokens**: a component's own CSS custom properties. Derived from
 *   the Custom Elements Manifest (CEM), the analyzer already extracts
 *   each component's `@cssproperty` JSDoc into `cssProperties`.
 * - **usesSemantics**: the semantic tokens the component reads via `var()`.
 *   Hand-declared today; Phase B's plan promotes this to a `@uses-token`
 *   JSDoc convention parsed by a CEM plugin.
 */
import cemRaw from "@fluid-ds/components/custom-elements.json";

interface CemCssProperty {
  name: string;
  description?: string;
}
interface CemUsesToken {
  name: string;
  description?: string;
}
interface CemDeclaration {
  tagName?: string;
  cssProperties?: CemCssProperty[];
  usesTokens?: CemUsesToken[];
}
interface CemModule {
  declarations?: CemDeclaration[];
}
interface Cem {
  modules?: CemModule[];
}

const cem = cemRaw as Cem;

export interface ComponentTokenRef {
  cssVar: string;
  label: string;
  type: "color" | "dimension" | "duration" | "fontFamily" | "fontWeight";
  range?: { min: number; max: number; step?: number; unit?: string };
}

export interface ComponentEntry {
  ownTokens: ComponentTokenRef[];
  usesSemantics: string[];
}

/**
 * Heuristic: guess a token's value type from its name. Works because we
 * follow naming conventions consistently, `*-bg`, `*-color`, `*-fg` are
 * colors; `*-size`, `*-width`, `*-padding`, `*-radius` are dimensions; etc.
 */
function guessType(cssVar: string): ComponentTokenRef["type"] {
  if (/-(bg|fg|color)(-|$)/.test(cssVar)) return "color";
  if (/-(size|width|height|padding|radius|max-width)(-|$)/.test(cssVar))
    return "dimension";
  if (/duration/.test(cssVar)) return "duration";
  if (/font-family|family/.test(cssVar)) return "fontFamily";
  return "color";
}

const LABEL_OVERRIDES: Record<string, string> = {
  bg: "Background",
  fg: "Foreground",
  color: "Color",
  border: "Border",
  "border-focus": "Border (focus)",
  "track-bg": "Track",
  "track-bg-on": "Track (on)",
  "thumb-bg": "Thumb",
  "thumb-color": "Thumb",
  "track-color": "Track",
  "fill-color": "Fill",
  "swatch-size": "Swatch size",
  "max-width": "Max width"
};

function labelFor(cssVar: string, tag: string): string {
  const prefix = `--${tag}-`;
  const stripped = cssVar.startsWith(prefix) ? cssVar.slice(prefix.length) : cssVar;
  if (stripped in LABEL_OVERRIDES) return LABEL_OVERRIDES[stripped]!;
  return stripped
    .split("-")
    .map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s))
    .join(" ");
}

function buildIndex(): {
  own: Record<string, ComponentTokenRef[]>;
  uses: Record<string, string[]>;
} {
  const own: Record<string, ComponentTokenRef[]> = {};
  const uses: Record<string, string[]> = {};
  for (const mod of cem.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (!decl.tagName) continue;
      if (decl.cssProperties?.length) {
        own[decl.tagName] = decl.cssProperties.map((p) => ({
          cssVar: p.name,
          label: labelFor(p.name, decl.tagName!),
          type: guessType(p.name)
        }));
      }
      if (decl.usesTokens?.length) {
        uses[decl.tagName] = decl.usesTokens.map((t) => t.name);
      }
    }
  }
  return { own, uses };
}

const { own: OWN_TOKENS, uses: USES_FROM_CEM } = buildIndex();

/**
 * Semantic dependencies, for components that haven't been migrated to the
 * `@uses-token` JSDoc convention yet, this fallback fills the gap. As each
 * component gets its JSDoc updated, its entry here can be deleted.
 */
const USES_FALLBACK: Record<string, string[]> = {
  "fluid-button": [
    "--fluid-accent-base",
    "--fluid-accent-hover",
    "--fluid-accent-active",
    "--fluid-accent-text",
    "--fluid-surface-muted",
    "--fluid-text-primary",
    "--fluid-border-default"
  ],
  "fluid-input": [
    "--fluid-surface-base",
    "--fluid-border-default",
    "--fluid-border-strong",
    "--fluid-accent-base",
    "--fluid-text-primary",
    "--fluid-text-secondary"
  ],
  "fluid-color-picker": ["--fluid-surface-base", "--fluid-border-default"],
  "fluid-switch": ["--fluid-accent-base", "--fluid-text-primary"],
  "fluid-slider": ["--fluid-accent-base", "--fluid-surface-base"],
  "fluid-card": [
    "--fluid-surface-base",
    "--fluid-surface-subtle",
    "--fluid-border-default",
    "--fluid-text-primary"
  ],
  "fluid-badge": [],
  "fluid-select": [
    "--fluid-surface-base",
    "--fluid-border-default",
    "--fluid-accent-base",
    "--fluid-text-primary"
  ],
  "fluid-tabs": [
    "--fluid-accent-base",
    "--fluid-border-default",
    "--fluid-text-primary",
    "--fluid-text-secondary"
  ],
  "fluid-tab": ["--fluid-accent-base", "--fluid-text-primary", "--fluid-text-secondary"],
  "fluid-accordion": ["--fluid-border-default"],
  "fluid-details": [
    "--fluid-border-default",
    "--fluid-text-primary",
    "--fluid-text-secondary"
  ],
  "fluid-tooltip": [],
  "fluid-segmented-control": [
    "--fluid-surface-muted",
    "--fluid-surface-base",
    "--fluid-accent-base"
  ],
  "fluid-segment": ["--fluid-text-primary", "--fluid-text-secondary"],
  "fluid-code-block": [],
  "fluid-divider": ["--fluid-border-default"],
  "fluid-icon": [],

  // Expansion pack components, until each pack ships its own CEM that the
  // playground ingests, list the semantic tokens they read here so design
  // mode can offer the right knobs.
  "fluid-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-bar-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-line-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-pie-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-doughnut-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-scatter-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-bubble-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-radar-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-polar-area-chart": ["--fluid-color-primary", "--fluid-text-primary"],
  "fluid-sparkline": ["--fluid-color-primary"],
  "fluid-markdown": ["--fluid-text-primary", "--fluid-color-primary", "--fluid-surface-muted"],
  "fluid-qr-code": ["--fluid-text-primary"],
  "fluid-animated-image": [],
  "fluid-video": [],
  "fluid-video-playlist": [
    "--fluid-color-primary",
    "--fluid-surface-base",
    "--fluid-border-default",
    "--fluid-text-primary"
  ],
  "fluid-zoomable-frame": ["--fluid-surface-muted", "--fluid-surface-base", "--fluid-text-primary"]
};

/**
 * Hand-curated own-token entries for expansion-pack components. They don't
 * appear in the main components CEM (cem analyze only scans
 * @fluid-ds/components), so we mirror the @cssproperty annotations by hand.
 */
const OWN_FALLBACK: Record<string, ComponentTokenRef[]> = {
  "fluid-chart": [{ cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }],
  "fluid-bar-chart": [{ cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }],
  "fluid-line-chart": [{ cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }],
  "fluid-pie-chart": [{ cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }],
  "fluid-doughnut-chart": [
    { cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }
  ],
  "fluid-scatter-chart": [
    { cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }
  ],
  "fluid-bubble-chart": [
    { cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }
  ],
  "fluid-radar-chart": [{ cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }],
  "fluid-polar-area-chart": [
    { cssVar: "--fluid-chart-height", label: "Height", type: "dimension" }
  ],
  "fluid-sparkline": [
    { cssVar: "--fluid-sparkline-color", label: "Color", type: "color" },
    { cssVar: "--fluid-sparkline-fill", label: "Fill", type: "color" },
    { cssVar: "--fluid-sparkline-height", label: "Height", type: "dimension" }
  ],
  "fluid-markdown": [{ cssVar: "--fluid-markdown-color", label: "Color", type: "color" }],
  "fluid-video": [{ cssVar: "--fluid-video-radius", label: "Radius", type: "dimension" }],
  "fluid-zoomable-frame": [{ cssVar: "--fluid-zoom-bg", label: "Background", type: "color" }]
};

/** Apply a range hint for known dimension tokens that benefit from a slider. */
const RANGE_HINTS: Record<string, ComponentTokenRef["range"]> = {
  "--fluid-icon-size": { min: 0.75, max: 4, step: 0.125, unit: "rem" },
  "--fluid-color-picker-swatch-size": { min: 0.75, max: 2, step: 0.125, unit: "rem" },
  "--fluid-tooltip-max-width": { min: 6, max: 32, step: 1, unit: "rem" },
  "--fluid-divider-width": { min: 1, max: 4, step: 1, unit: "px" },
  "--fluid-card-padding": { min: 0.5, max: 3, step: 0.25, unit: "rem" }
};

export function entriesFor(tag: string): ComponentEntry | undefined {
  // Prefer CEM-derived own tokens; if the component lives in an expansion
  // pack that doesn't ship into the main CEM, fall back to the hand-curated
  // OWN_FALLBACK list.
  const own = OWN_TOKENS[tag] ?? OWN_FALLBACK[tag];
  // CEM-derived @uses-token wins; hand-coded fallback fills the gap until
  // every component carries the JSDoc.
  const semantics = USES_FROM_CEM[tag] ?? USES_FALLBACK[tag];
  if (!own && !semantics) return undefined;
  return {
    ownTokens: (own ?? []).map((t) =>
      RANGE_HINTS[t.cssVar] ? { ...t, range: RANGE_HINTS[t.cssVar] } : t
    ),
    usesSemantics: semantics ?? []
  };
}

/** Tags we have any data for, useful for diagnostics. */
export function allKnownTags(): string[] {
  return Array.from(
    new Set([
      ...Object.keys(OWN_TOKENS),
      ...Object.keys(OWN_FALLBACK),
      ...Object.keys(USES_FROM_CEM),
      ...Object.keys(USES_FALLBACK)
    ])
  ).sort();
}
