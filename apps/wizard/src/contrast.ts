/**
 * WCAG 2.x contrast math. Pure functions, no DOM. Used by the accent + tones
 * steps to show live AA/AAA verdicts as the user picks colors.
 *
 * Formula per https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio:
 *   ratio = (L1 + 0.05) / (L2 + 0.05), L1 ≥ L2, where L is relative luminance.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parse #rgb / #rrggbb (with or without leading #) to 0–255 channels. */
export function parseHex(hex: string): Rgb | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

/** Relative luminance of an sRGB color (0–1). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio (1–21) between two hex colors. Returns 1 if unparseable. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastLevel = "fail" | "aa-large" | "aa" | "aaa";

/** Classify a ratio against WCAG thresholds for normal-size text. */
export function rateContrast(ratio: number): ContrastLevel {
  if (ratio >= 7) return "aaa"; // 1.4.6
  if (ratio >= 4.5) return "aa"; // 1.4.3
  if (ratio >= 3) return "aa-large"; // 1.4.3 large text / 1.4.11 non-text
  return "fail";
}

/** One-line verdict for UI. */
export function contrastVerdict(
  ratio: number,
  { needNonText = false } = {}
): { tone: "success" | "warning" | "danger"; label: string } {
  const r = ratio.toFixed(2);
  if (needNonText) {
    // SC 1.4.11, UI components / focus rings need ≥ 3:1.
    return ratio >= 3
      ? { tone: "success", label: `${r}:1, passes 3:1 (non-text)` }
      : { tone: "danger", label: `${r}:1, below 3:1 (non-text)` };
  }
  const level = rateContrast(ratio);
  if (level === "aaa") return { tone: "success", label: `${r}:1, AAA` };
  if (level === "aa") return { tone: "success", label: `${r}:1, AA` };
  if (level === "aa-large") return { tone: "warning", label: `${r}:1, AA large text only` };
  return { tone: "danger", label: `${r}:1, fails AA` };
}
