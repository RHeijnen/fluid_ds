/**
 * Color resolution for celebration effects.
 *
 * By default an effect draws in the Fluid brand accent plus the semantic
 * status tones, read live from CSS custom properties on the document root
 * so a burst matches whatever brand / theme is active. Every effect
 * accepts an explicit `colors` array that fully overrides this.
 */

/** Semantic CSS custom properties an effect samples by default. */
const DEFAULT_TOKENS = [
  "--fluid-accent-base",
  "--fluid-success-base",
  "--fluid-warning-base",
  "--fluid-danger-base",
  "--fluid-info-base"
];

/** Static fallback palette used when no tokens resolve (SSR / bare page). */
const FALLBACK = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

/** A cheerful, brand-independent palette used by `pride`-style presets. */
export const RAINBOW = [
  "#e40303",
  "#ff8c00",
  "#ffed00",
  "#008026",
  "#004dff",
  "#750787"
];

/**
 * Read the default Fluid palette from the live document, falling back to
 * a static set of hues when a token is empty or we are off-DOM.
 */
export function defaultColors(): string[] {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") {
    return [...FALLBACK];
  }
  const styles = getComputedStyle(document.documentElement);
  const resolved: string[] = [];
  for (const token of DEFAULT_TOKENS) {
    const value = styles.getPropertyValue(token).trim();
    if (value) resolved.push(value);
  }
  return resolved.length ? resolved : [...FALLBACK];
}

/**
 * Resolve an effect's working palette: the caller's `colors` if provided
 * and non-empty, otherwise the live Fluid palette.
 */
export function resolvePalette(colors?: readonly string[]): string[] {
  if (colors && colors.length) return [...colors];
  return defaultColors();
}

/** Pick a pseudo-random color from a palette. */
export function pick(palette: readonly string[]): string {
  if (palette.length === 0) return FALLBACK[0] as string;
  const i = Math.floor(Math.random() * palette.length);
  return palette[i] as string;
}
