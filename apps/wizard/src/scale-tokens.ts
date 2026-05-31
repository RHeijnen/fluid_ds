import { manifest, resolveSemanticValue } from "./theme-manifest.js";
import { themeStore } from "./theme-store.js";

/**
 * Multiply every rem-valued primitive under a cssVar prefix by `factor` and
 * write the result into the theme store. `factor === 1` clears the overrides
 * (revert to default). Non-rem values (0, 9999px) are skipped, so radius `none`
 * / `full` and space `0` are left alone.
 *
 * Powers the type-scale, roundness, and density controls, one slider derives a
 * whole token ramp instead of editing each stop.
 */
export function scaleRemTokens(prefix: string, factor: number): void {
  for (const p of manifest.primitives) {
    if (!p.cssVar.startsWith(prefix)) continue;
    const m = /^([\d.]+)rem$/.exec(p.value);
    if (!m) continue;
    const base = parseFloat(m[1]!);
    themeStore.set(p.cssVar, factor === 1 ? "" : `${+(base * factor).toFixed(4)}rem`);
  }
}

/**
 * The current scale factor implied by an override on a representative token
 * (override value ÷ default value). Returns 1 when there's no override, used
 * to restore a slider's position from persisted state so the control reflects
 * reality instead of resetting to 1×.
 */
export function currentScale(sampleVar: string): number {
  const override = themeStore.diff()[sampleVar];
  if (!override) return 1;
  const def = themeStore.defaults(sampleVar);
  const d = def ? parseFloat(def) : NaN;
  const o = parseFloat(override);
  return Number.isFinite(d) && d > 0 && Number.isFinite(o) ? +(o / d).toFixed(2) : 1;
}

/** Resolve a semantic token's default concrete value (e.g. tone base hex). */
export function semanticDefault(cssVar: string): string {
  const entry = manifest.semantics.light.find((s) => s.cssVar === cssVar);
  if (!entry) return "";
  return entry.referencesPrimitive ? resolveSemanticValue(entry.value) : entry.value;
}
