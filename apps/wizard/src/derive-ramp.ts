/**
 * Derive a full 10-stop brand ramp (50…900) from a single seed color.
 *
 * Strategy (no dependencies): work in OKLCH for perceptual evenness. Read the
 * design system's *own* default brand ramp from the token manifest and capture
 * its lightness + chroma curve. Then recolor that curve to the seed's hue,
 * scaling chroma so the seed's saturation carries through while keeping the
 * system's pleasing light→dark falloff. Out-of-gamut results are reduced in
 * chroma until they fit sRGB.
 *
 * This is "good, not perfect" by design (per the wizard plan), the accent step
 * exposes a manual per-stop override as the escape hatch.
 */
import { manifest } from "./theme-manifest.js";
import { parseHex, type Rgb } from "./contrast.js";

const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

// ---- sRGB <-> OKLCH ---------------------------------------------------------

interface Oklch {
  L: number;
  C: number;
  h: number;
}

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
}

function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.hypot(a, bb);
  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

function oklchToRgb({ L, C, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return { r: linearToSrgb(lr), g: linearToSrgb(lg), b: linearToSrgb(lb) };
}

function toHex({ r, g, b }: Rgb): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Clamp an OKLCH color into sRGB gamut by binary-searching chroma down. */
function gamutClampedHex(color: Oklch): string {
  let lo = 0;
  let hi = color.C;
  // If full chroma is already in gamut, keep it.
  let best = oklchToRgb(color);
  if (chromaFits(color)) return toHex(best);
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (chromaFits({ ...color, C: mid })) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  best = oklchToRgb({ ...color, C: lo });
  return toHex(best);
}

/** True if converting this OKLCH back to linear sRGB stays within [0,1]. */
function chromaFits({ L, C, h }: Oklch): boolean {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const eps = 0.0005;
  return [lr, lg, lb].every((c) => c >= -eps && c <= 1 + eps);
}

interface RampPoint {
  stop: number;
  cssVar: string;
  L: number;
  C: number;
}

/** Read the default brand ramp's OKLCH lightness/chroma curve from the manifest. */
function defaultBrandCurve(): RampPoint[] {
  const points: RampPoint[] = [];
  for (const stop of STOPS) {
    const cssVar = `--fluid-color-brand-${stop}`;
    const entry = manifest.primitives.find((t) => t.cssVar === cssVar);
    const rgb = entry ? parseHex(entry.value) : null;
    if (!rgb) continue;
    const { L, C } = rgbToOklch(rgb);
    points.push({ stop, cssVar, L, C });
  }
  return points;
}

export interface DerivedStop {
  stop: number;
  cssVar: string;
  hex: string;
}

/**
 * Build the 10-stop ramp for a seed hex. Each output stop keeps the default
 * ramp's lightness, takes the seed's hue, and scales the default chroma by the
 * seed's saturation relative to the default mid-tone, then gamut-clamps.
 */
export function deriveRamp(seedHex: string): DerivedStop[] {
  const seedRgb = parseHex(seedHex);
  const curve = defaultBrandCurve();
  if (!seedRgb || !curve.length) return [];
  const seed = rgbToOklch(seedRgb);

  // Reference mid chroma from the default ramp (≈ the 500/600 stop).
  const mid = curve.find((p) => p.stop === 600) ?? curve[Math.floor(curve.length / 2)]!;
  const chromaScale = mid.C > 0 ? Math.min(2, seed.C / mid.C) : 1;

  return curve.map((p) => ({
    stop: p.stop,
    cssVar: p.cssVar,
    hex: gamutClampedHex({ L: p.L, C: p.C * chromaScale, h: seed.h })
  }));
}

/** Pull a single default brand stop hex (used to seed the picker from a preset). */
export function defaultBrandStop(stop: number): string | undefined {
  return manifest.primitives.find((t) => t.cssVar === `--fluid-color-brand-${stop}`)?.value;
}
