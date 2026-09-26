/**
 * Rainbow illustrated icons.
 *
 * Multi-color "app icon" artwork that pairs with the Rainbow brand preset
 * (`@fluid-ds/themes/rainbow.css`): a squircle tile with a chunky ink outline
 * and flat pastel fills. Unlike the lucide glyphs these are illustrations, not
 * `currentColor` line art, so they carry their own palette.
 *
 * Every fill reads the theme's public palette (`--rainbow-blue`, `--rainbow-ink`
 * and so on) with the Rainbow hex as the fallback, so the icons follow a
 * retuned palette inside a rainbow subtree and still render correctly anywhere
 * else. Ids inside the SVGs are only referenced within the same icon, and each
 * `<fluid-icon>` renders into its own shadow root, so repeated icons never
 * collide.
 *
 * ```ts
 * import "@fluid-ds/rainbow/icons/register"; // registers rainbow-chat, rainbow-chart, …
 * ```
 * ```html
 * <fluid-icon name="rainbow-chat" style="--fluid-icon-size: 4rem"></fluid-icon>
 * ```
 */
import { registerIcons } from "@fluid-ds/icons/registry";

const c = {
  ink: "var(--rainbow-ink, #3b3634)",
  paper: "var(--rainbow-paper, #ffffff)",
  sand: "var(--rainbow-sand, #ecdcc8)",
  blue: "var(--rainbow-blue, #aebdf0)",
  blueDeep: "var(--rainbow-blue-deep, #8ea3e6)",
  green: "var(--rainbow-green, #9cc587)",
  greenDeep: "var(--rainbow-green-deep, #6f9f63)",
  yellow: "var(--rainbow-yellow, #ffd86e)",
  pink: "var(--rainbow-pink, #f6b3c4)",
  rose: "var(--rainbow-rose, #e8738a)",
  purple: "var(--rainbow-purple, #bba8e0)",
  purpleDeep: "var(--rainbow-purple-deep, #9a82c9)",
  coral: "var(--rainbow-coral, #f28b7b)",
  tan: "var(--rainbow-tan, #c4a595)"
};

/** Wrap an icon body in the shared tile: 64×64, clipped squircle, ink outline on top. */
function tile(id: string, body: string): string {
  const clip = `rbw-${id}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" ` +
    `stroke="${c.ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" ` +
    `aria-hidden="true" focusable="false">` +
    `<defs><clipPath id="${clip}"><rect x="4" y="4" width="56" height="56" rx="17"/></clipPath></defs>` +
    body.replaceAll("CLIP", `url(#${clip})`) +
    `<rect x="4" y="4" width="56" height="56" rx="17" stroke-width="4"/></svg>`
  );
}

const dot = (x: number, y: number, r = 1.5) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.ink}" stroke="none"/>`;
const fill = (color: string) => `<rect width="64" height="64" fill="${color}" stroke="none"/>`;

export const rainbowIcons: Record<string, string> = {
  "rainbow-chat": tile(
    "chat",
    `<g clip-path="CLIP">${fill(c.yellow)}<rect y="42" width="64" height="22" fill="${c.purple}" stroke="none"/></g>` +
      `<path d="M4 42h56"/><path d="M15 21v12M24 21v12M15 27h9M30 25v8"/>` +
      `<circle cx="30" cy="20" r="0.6" fill="${c.ink}" stroke-width="3"/>` +
      dot(38, 32, 1) +
      dot(44, 32, 1) +
      dot(50, 32, 1) +
      `<path d="M22 42l-3 8 9-8" fill="${c.yellow}"/>`
  ),
  "rainbow-chart": tile(
    "chart",
    `<g clip-path="CLIP">${fill(c.blue)}</g>` +
      `<rect x="15" y="32" width="8" height="15" rx="3" fill="${c.pink}"/>` +
      `<rect x="28" y="22" width="8" height="25" rx="3" fill="${c.yellow}"/>` +
      `<rect x="41" y="15" width="8" height="32" rx="3" fill="${c.paper}"/>`
  ),
  "rainbow-lock": tile(
    "lock",
    `<g clip-path="CLIP">${fill(c.green)}<path d="M0 46C16 38 30 50 64 40V64H0Z" fill="${c.paper}"/></g>` +
      `<path d="M24 29v-5a8 8 0 0 1 16 0v5"/>` +
      `<rect x="19" y="29" width="26" height="19" rx="6" fill="${c.yellow}"/><path d="M32 36v5"/>`
  ),
  "rainbow-calendar": tile(
    "calendar",
    `<g clip-path="CLIP">${fill(c.paper)}<rect width="64" height="21" fill="${c.rose}"/></g>` +
      dot(22, 14, 2) +
      dot(42, 14, 2) +
      // A week of days, with today circled.
      [18, 32, 46]
        .map((x) => `<circle cx="${x}" cy="33" r="2.5" fill="${c.pink}" stroke="none"/>`)
        .join("") +
      [18, 46]
        .map((x) => `<circle cx="${x}" cy="45" r="2.5" fill="${c.pink}" stroke="none"/>`)
        .join("") +
      `<circle cx="32" cy="45" r="5" fill="${c.yellow}" stroke-width="3"/>`
  ),
  "rainbow-bolt": tile(
    "bolt",
    `<g clip-path="CLIP">${fill(c.yellow)}<circle cx="54" cy="54" r="20" fill="${c.coral}"/></g>` +
      `<path d="M35 12 20 35h11l-3 17 16-24H33z" fill="${c.paper}"/>`
  ),
  "rainbow-cloud": tile(
    "cloud",
    `<g clip-path="CLIP">${fill(c.blue)}<circle cx="42" cy="24" r="10" fill="${c.yellow}"/></g>` +
      `<path d="M17 45a8 8 0 0 1 1-16 11 11 0 0 1 21-3 9 9 0 0 1 8 13 6 6 0 0 1-3 6z" fill="${c.paper}"/>`
  ),
  "rainbow-globe": tile(
    "globe",
    `<g clip-path="CLIP">${fill(c.purple)}</g>` +
      `<circle cx="32" cy="32" r="16" fill="${c.paper}"/>` +
      `<path d="M16 32h32M32 16c-6 5-6 27 0 32M32 16c6 5 6 27 0 32" stroke-width="3"/>` +
      `<path d="M17.5 25h29M17.5 39h29" stroke-width="2.5"/>`
  ),
  "rainbow-gear": tile(
    "gear",
    `<g clip-path="CLIP">${fill(c.paper)}<rect width="64" height="30" fill="${c.sand}"/></g>` +
      `<path d="M4 30h56"/><rect x="22" y="15" width="20" height="10" rx="4" fill="${c.tan}"/>` +
      `<path d="M32 25v10"/><circle cx="32" cy="43" r="8" fill="${c.green}"/>`
  ),
  "rainbow-mail": tile(
    "mail",
    `<g clip-path="CLIP">${fill(c.blue)}<path d="M0 46C18 40 40 52 64 44V64H0Z" fill="${c.paper}"/></g>` +
      `<rect x="15" y="19" width="34" height="23" rx="5" fill="${c.yellow}"/><path d="M16 21l16 11 16-11"/>`
  ),
  "rainbow-clock": tile(
    "clock",
    `<g clip-path="CLIP">${fill(c.paper)}<rect width="64" height="26" fill="${c.rose}"/></g>` +
      `<path d="M4 26h56"/><circle cx="24" cy="21" r="7" fill="${c.pink}"/>` +
      `<circle cx="40" cy="21" r="7" fill="${c.pink}"/><path d="M24 38v8h8"/>`
  ),
  "rainbow-music": tile(
    "music",
    `<g clip-path="CLIP">${fill(c.paper)}<circle cx="32" cy="32" r="26" fill="${c.pink}"/>` +
      `<circle cx="32" cy="32" r="18" fill="${c.blue}"/><circle cx="32" cy="32" r="10" fill="${c.purpleDeep}"/>` +
      `<rect width="32" height="64" fill="${c.paper}"/></g>` +
      `<path d="M32 4v56"/><path d="M14 28v8M20 24v16M26 29v6"/>`
  ),
  "rainbow-gallery": tile(
    "gallery",
    `<g clip-path="CLIP">${fill(c.purple)}<path d="M0 44C16 34 40 50 64 38V64H0Z" fill="${c.paper}"/></g>` +
      `<path d="M22 44V34"/><path d="M22 22c5 0 7 7 6 11a6 6 0 0 1-12 0c-1-4 1-11 6-11z" fill="${c.green}"/>` +
      `<path d="M42 41c4 0 6 5 5 8H37c-1-3 1-8 5-8z" fill="${c.greenDeep}"/>` +
      `<path d="M46 15l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="${c.paper}" stroke-width="2"/>`
  ),
  "rainbow-game": tile(
    "game",
    `<g clip-path="CLIP">${fill(c.blue)}<rect width="64" height="24" fill="${c.paper}"/></g>` +
      `<path d="M4 24h56"/>` +
      dot(17, 15) +
      dot(24, 15) +
      `<rect x="14" y="32" width="15" height="15" rx="5" fill="${c.paper}"/><path d="M21.5 36v7M18 39.5h7" stroke-width="3"/>` +
      `<rect x="35" y="32" width="15" height="15" rx="5" fill="${c.pink}"/><path d="M39 37.5h7M39 41.5h7" stroke-width="3"/>`
  ),
  "rainbow-logo": tile(
    "logo",
    `<g clip-path="CLIP">${fill(c.paper)}<circle cx="32" cy="50" r="30" fill="${c.pink}"/>` +
      `<circle cx="32" cy="50" r="22" fill="${c.yellow}"/><circle cx="32" cy="50" r="14" fill="${c.blue}"/>` +
      `<circle cx="32" cy="50" r="6" fill="${c.paper}"/></g><path d="M4 50h56"/>`
  )
};

/** The names this set registers, in display order. */
export const rainbowIconNames = Object.keys(rainbowIcons);

/** Register every Rainbow icon with the shared registry. */
export function registerRainbowIcons(): void {
  registerIcons(rainbowIcons);
}
