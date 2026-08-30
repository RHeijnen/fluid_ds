/**
 * Color resolution for celebration effects.
 *
 * Effects supply purpose-tuned palettes where their subject calls for one;
 * generic celebration effects fall back to the multi-color palette here.
 * Tinting to the brand is opt-in: pass `colors: brandColors()` (or any array).
 * `brandColors()` reads the live brand ramp from the document, so an opted-in
 * effect follows a brand / theme switch.
 */

/** The default festive palette: brand-independent, always colorful. */
const FESTIVE = ["#6366f1", "#3b82f6", "#ec4899", "#22c55e", "#f59e0b", "#ef4444"];

/** Brand-ramp CSS custom properties `brandColors()` samples, light to dark, so
 *  an opted-in burst carries the active brand's hue with tonal depth. */
const BRAND_TOKENS = [
  "--fluid-color-brand-300",
  "--fluid-color-brand-400",
  "--fluid-color-brand-500",
  "--fluid-color-brand-600",
  "--fluid-color-brand-700"
];

/** Static fallback (the default blue ramp) for when brand tokens do not resolve
 *  (SSR / a bare page with no tokens loaded). */
const BRAND_FALLBACK = ["#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"];

/** A cheerful, brand-independent palette used by `pride`-style presets. */
export const RAINBOW = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"];

/** Brand-independent fallback palette for generic celebration effects. */
export function defaultColors(): string[] {
  return [...FESTIVE];
}

/**
 * Opt-in brand palette: read a range of the live Fluid brand ramp from the
 * document, so a burst is tinted to the active brand / theme (blue on the
 * default brand, graphite on Titanium, and so on). Pass it as an effect's
 * `colors`: `confetti({ colors: brandColors() })`. Falls back to the default
 * blue ramp off-DOM or when tokens are empty.
 */
export function brandColors(): string[] {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") {
    return [...BRAND_FALLBACK];
  }
  const styles = getComputedStyle(document.documentElement);
  const resolved: string[] = [];
  for (const token of BRAND_TOKENS) {
    const value = styles.getPropertyValue(token).trim();
    if (value) resolved.push(value);
  }
  return resolved.length ? resolved : [...BRAND_FALLBACK];
}

/**
 * Resolve a working palette: the supplied colors when non-empty, otherwise the
 * generic celebration fallback. Effects can pass their purpose-tuned palette
 * here; consumers can pass `brandColors()` to brand-tint.
 */
export function resolvePalette(colors?: readonly string[]): string[] {
  if (colors && colors.length) return [...colors];
  return defaultColors();
}

/** Pick a pseudo-random color from a palette. */
export function pick(palette: readonly string[]): string {
  if (palette.length === 0) return FESTIVE[0] as string;
  const i = Math.floor(Math.random() * palette.length);
  return palette[i] as string;
}
