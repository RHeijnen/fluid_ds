const palettes = [
  ["#0f766e", "#5eead4", "#fef3c7"],
  ["#7c2d12", "#fb923c", "#ffedd5"],
  ["#1e3a8a", "#60a5fa", "#dbeafe"],
  ["#581c87", "#c084fc", "#f3e8ff"],
  ["#365314", "#a3e635", "#ecfccb"],
  ["#831843", "#f472b6", "#fce7f3"],
  ["#334155", "#94a3b8", "#f1f5f9"]
] as const;

/** Deterministic story-only thumbnails; each has real image dimensions but performs no request. */
export function offlineLightboxImage(index: number): string {
  const [dark, accent, pale] = palettes[(index - 1) % palettes.length]!;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${pale}"/>
    <circle cx="148" cy="52" r="30" fill="${accent}"/>
    <path d="m0 152 58-70 43 44 28-30 71 70v34H0Z" fill="${dark}"/>
    <path d="m0 174 66-48 38 30 34-22 62 42v24H0Z" fill="${accent}" opacity=".8"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
