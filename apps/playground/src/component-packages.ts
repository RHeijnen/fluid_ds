/**
 * Map of `tag → expansion package name`. Components ship in `@fluid-ds/components`
 * by default; anything heavier (charts, markdown, video, qr) lives in a
 * separate package so consumers don't pull in dependencies they don't need.
 *
 * The playground reads this map to:
 *   1. Show a "requires @fluid-ds/X" badge on the preview card
 *   2. Let the Design Mode inspector explain why a component is in its
 *      own package
 *
 * Phase D promotes this to a CEM-driven `@package` JSDoc convention; for
 * now it's a single source of truth kept in the playground.
 */
export const EXPANSION_PACKAGES: Record<string, string> = {
  // Charts, Chart.js based, lazy-loaded
  "fluid-chart": "@fluid-ds/charts",
  "fluid-bar-chart": "@fluid-ds/charts",
  "fluid-line-chart": "@fluid-ds/charts",
  "fluid-pie-chart": "@fluid-ds/charts",
  "fluid-doughnut-chart": "@fluid-ds/charts",
  "fluid-scatter-chart": "@fluid-ds/charts",
  "fluid-bubble-chart": "@fluid-ds/charts",
  "fluid-radar-chart": "@fluid-ds/charts",
  "fluid-polar-area-chart": "@fluid-ds/charts",
  "fluid-sparkline": "@fluid-ds/charts",

  // Markdown, marked + DOMPurify
  "fluid-markdown": "@fluid-ds/markdown",

  // QR Code, qrcode-generator
  "fluid-qr-code": "@fluid-ds/qr",

  // Media, video, animated images, zoomable frame
  "fluid-video": "@fluid-ds/media",
  "fluid-video-playlist": "@fluid-ds/media",
  "fluid-animated-image": "@fluid-ds/media",
  "fluid-zoomable-frame": "@fluid-ds/media"
};

export function packageFor(tag: string): string {
  return EXPANSION_PACKAGES[tag] ?? "@fluid-ds/components";
}

export function isExpansion(tag: string): boolean {
  return tag in EXPANSION_PACKAGES;
}
