/**
 * Rainbow illustrations.
 *
 * Multi-color artwork that pairs with the Rainbow brand preset
 * (`@fluid-ds/themes/rainbow.css`). Two formats share one drawing language
 * (flat pastel fills, a chunky 3.5 unit ink outline, round caps and joins):
 *
 * - App tiles: a 64×64 squircle tile, clipped, with a 4 unit rim.
 * - Spot illustrations (`rainbow-spot-*`): a wider 160×120 scene on a soft
 *   blob, for empty states and results.
 *
 * Unlike the lucide glyphs these are illustrations, not `currentColor` line
 * art, so they carry their own palette. Every fill reads the theme's public
 * palette (`--rainbow-blue`, `--rainbow-ink` and so on) with the Rainbow hex as
 * the fallback, so they follow a retuned palette inside a rainbow subtree and
 * still render correctly anywhere else. The outer rim reads `--rainbow-line`,
 * which turns cream in the dark scheme so the tile keeps its edge on charcoal.
 *
 * Every id inside an SVG is prefixed `rbw-<name>` and is unique across the
 * whole set, so the artwork is safe even when inlined into one document.
 *
 * ```ts
 * import "@fluid-ds/rainbow/illustrations/register"; // registers rainbow-chat, rainbow-spot-success, …
 * ```
 * ```html
 * <fluid-icon name="rainbow-chat" style="--fluid-icon-size: 4rem"></fluid-icon>
 * ```
 */
import { registerIcons } from "@fluid-ds/icons/registry";

const c = {
  ink: "var(--rainbow-ink, #3b3634)",
  line: "var(--rainbow-line, #3b3634)",
  paper: "var(--rainbow-paper, #ffffff)",
  cream: "var(--rainbow-cream, #fdf5ef)",
  sand: "var(--rainbow-sand, #f6ebe1)",
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

const ROOT =
  `xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${c.ink}" stroke-width="3.5" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;
const TILE = `<rect x="4" y="4" width="56" height="56" rx="17"/>`;

/**
 * Wrap a drawing in the shared app tile: 64×64, everything clipped to the
 * squircle, and the rim drawn last so nothing can poke past it.
 */
function tile(name: string, body: string, defs = ""): string {
  const id = `rbw-${name}`;
  return (
    `<svg ${ROOT} width="64" height="64" viewBox="0 0 64 64">` +
    `<defs><clipPath id="${id}">${TILE}</clipPath>${defs}</defs>` +
    `<g clip-path="url(#${id})">${body}</g>` +
    `<rect x="4" y="4" width="56" height="56" rx="17" stroke="${c.line}" stroke-width="4"/></svg>`
  );
}

/** The soft blob every spot illustration sits on. */
const BLOB = "M80 8C120 8 146 24 150 56 154 90 122 112 80 112S6 90 10 56C14 24 40 8 80 8Z";

/**
 * Wrap a scene in the shared spot frame: 160×120 on a pastel blob. `inside` is
 * clipped to the blob (grounds, hills); `over` draws on top, unclipped, and
 * must stay within the blob so every ink line sits on a fill in dark mode too.
 */
function spot(name: string, color: string, inside: string, over: string, defs = ""): string {
  const id = `rbw-spot-${name}`;
  return (
    `<svg ${ROOT} width="160" height="120" viewBox="0 0 160 120">` +
    `<defs><clipPath id="${id}"><path d="${BLOB}"/></clipPath>${defs}</defs>` +
    `<path d="${BLOB}" fill="${color}" stroke="none"/>` +
    `<g clip-path="url(#${id})">${inside}</g>${over}` +
    `<path d="${BLOB}" stroke="${c.line}" stroke-width="4"/></svg>`
  );
}

// ── Drawing helpers ───────────────────────────────────────────────────────
const r1 = (n: number) => Math.round(n * 10) / 10;
const bg = (color: string) => `<rect width="64" height="64" fill="${color}" stroke="none"/>`;
const dot = (x: number, y: number, r = 2.2) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.ink}" stroke="none"/>`;
const circle = (x: number, y: number, r: number, fill = "none", extra = "") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${extra}/>`;
const rect = (x: number, y: number, w: number, h: number, rx: number, fill = "none", extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${extra}/>`;
const path = (d: string, fill = "none", extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const group = (transform: string, body: string) => `<g transform="${transform}">${body}</g>`;

/**
 * A union of simple shapes with one shared outline: the shapes are first
 * drawn fat in ink, then filled on top, so inner seams disappear. Used for
 * clouds, smoke and anything puffy.
 */
const puff = (shapes: string, fill: string) =>
  `<g fill="${c.ink}" stroke-width="7">${shapes}</g><g fill="${fill}" stroke="none">${shapes}</g>`;

/** An outlined band of color along a path: ink edges with a colored core. */
const tube = (d: string, color: string, core = 4, cap = "round") =>
  `<path d="${d}" stroke-width="${core + 7}" stroke-linecap="${cap}"/>` +
  `<path d="${d}" stroke="${color}" stroke-width="${core}" stroke-linecap="${cap}"/>`;

/** A regular star polygon (`points` tips) as a path. */
function star(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d += `${i ? "L" : "M"}${r1(cx + r * Math.cos(a))} ${r1(cy + r * Math.sin(a))}`;
  }
  return d + "Z";
}

/** A four-point twinkle with curved sides. */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

/** A cog outline with `teeth` flat-topped teeth. */
function cog(cx: number, cy: number, outer: number, inner: number, teeth: number): string {
  let d = "";
  const step = (Math.PI * 2) / teeth;
  const pt = (r: number, a: number) => `${r1(cx + r * Math.cos(a))} ${r1(cy + r * Math.sin(a))}`;
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    d +=
      `${i ? "L" : "M"}${pt(inner, a - step * 0.3)}` +
      `L${pt(outer, a - step * 0.18)}L${pt(outer, a + step * 0.18)}L${pt(inner, a + step * 0.3)}`;
  }
  return d + "Z";
}

/** A rolling hill across the bottom of a tile, outlined along its top. */
const hill = (color: string, d = "M0 46C18 40 40 52 64 44V64H0Z") => path(d, color);

/** A plump teardrop (rain, paint), point up. */
const drop = (x: number, y: number, fill: string) =>
  path(`M${x} ${y}c-2.6 3.6-4 6.2-4 8a4 4 0 0 0 8 0c0-1.8-1.4-4.4-4-8z`, fill);

// ── App tiles ─────────────────────────────────────────────────────────────
const tiles: Record<string, string> = {
  // Communication
  chat: [
    bg(c.yellow),
    hill(c.purple),
    path(
      "M22 15H42A10 10 0 0 1 52 25V31A10 10 0 0 1 42 41H30L20 49V40.8A10 10 0 0 1 12 31V25A10 10 0 0 1 22 15Z",
      c.paper
    ),
    dot(23, 28, 2.8),
    dot(32, 28, 2.8),
    dot(41, 28, 2.8)
  ].join(""),
  mail: [
    bg(c.blue),
    hill(c.paper),
    rect(13, 19, 38, 26, 5, c.yellow),
    path("M18 24l14 10 14-10")
  ].join(""),
  inbox: [
    bg(c.purple),
    path("M12 34l6-17h28l6 17v12a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z", c.paper),
    path("M12 34h11l3 5h12l3-5h11v12a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z", c.blue),
    path("M24 24h16M22 29h20")
  ].join(""),
  send: [
    bg(c.blue),
    path("M12 44h7M15 51h9"),
    path("M11 31L52 13 30 37Z", c.paper),
    path("M30 37L52 13 41 50Z", c.pink),
    path("M30 37v11l5-6", c.sand)
  ].join(""),
  bell: [
    bg(c.coral),
    circle(32, 46, 4, c.yellow),
    path("M19 42c0-4 3-6 3-13a10 10 0 0 1 20 0c0 7 3 9 3 13z", c.yellow),
    path("M32 19v-4"),
    path("M13 22c0-3 1.5-5.5 3.5-7.5M51 22c0-3-1.5-5.5-3.5-7.5")
  ].join(""),
  phone: [
    bg(c.green),
    hill(c.paper, "M0 50C20 44 44 56 64 48V64H0Z"),
    rect(19, 10, 26, 44, 7, c.paper),
    rect(23.5, 17, 17, 26, 2.5, c.yellow, ` stroke="none"`),
    path("M29 13.5h6"),
    dot(32, 48.5, 2.2)
  ].join(""),
  link: [
    bg(c.pink),
    group(
      "rotate(-45 32 32)",
      tube("M18 26h10a6 6 0 0 1 0 12H18a6 6 0 0 1 0-12z", c.yellow) +
        tube("M36 26h10a6 6 0 0 1 0 12H36a6 6 0 0 1 0-12z", c.blue) +
        tube("M28 26a6 6 0 0 1 6 6", c.yellow, 4, "butt")
    )
  ].join(""),

  // People
  user: [
    bg(c.purple),
    path("M16 52a16 14 0 0 1 32 0z", c.pink),
    circle(32, 25, 9, c.yellow),
    dot(28.5, 25, 1.6),
    dot(35.5, 25, 1.6)
  ].join(""),
  team: [
    bg(c.yellow),
    path("M30 48a11 11 0 0 1 22 0z", c.blue),
    circle(41, 26, 7, c.paper),
    path("M11 52a13 12 0 0 1 26 0z", c.pink),
    circle(24, 29, 8, c.paper)
  ].join(""),
  heart: [
    bg(c.pink),
    path("M32 50C16 40 12 30 14 24c2-7 13-9 18-1 5-8 16-6 18 1 2 6-2 16-18 26z", c.rose),
    path("M20 26c.5-2 2-3.5 4-3.8", "none", ` stroke="${c.paper}"`)
  ].join(""),
  star: [
    bg(c.purple),
    path(star(32, 33.5, 19, 9), c.yellow),
    dot(28, 33, 1.8),
    dot(36, 33, 1.8)
  ].join(""),
  gift: [
    bg(c.purple),
    path("M32 22c-3-7-11-8-11-3 0 3 5 4 11 3zM32 22c3-7 11-8 11-3 0 3-5 4-11 3z", c.yellow),
    rect(16, 31, 32, 19, 3, c.pink),
    rect(13, 23, 38, 9, 3, c.coral),
    path("M32 23v27")
  ].join(""),
  balloon: [
    bg(c.blue),
    path("M32 44c-2 3 2 5 0 8s2 5 0 8"),
    path("M29.5 45h5l-1-3h-3z", c.coral),
    path(
      "M32 11c-8 0-13.5 6.2-13.5 13.8C18.5 33.6 26 40 32 42c6-2 13.5-8.4 13.5-17.2C45.5 17.2 40 11 32 11z",
      c.coral
    ),
    path("M25 22c.8-2.6 2.6-4.3 5-5", "none", ` stroke="${c.paper}"`)
  ].join(""),
  trophy: [
    bg(c.blue),
    path("M21 18h-4a4.5 4.5 0 0 0 0 9h5M43 18h4a4.5 4.5 0 0 1 0 9h-5"),
    rect(28.5, 34, 7, 9, 1, c.yellow),
    path("M21 14h22v10a11 11 0 0 1-22 0z", c.yellow),
    rect(21, 42, 22, 8, 3, c.coral),
    path("M26 19v4", "none", ` stroke="${c.paper}"`)
  ].join(""),

  // Media
  music: [
    bg(c.purple),
    hill(c.pink, "M0 50C20 42 44 54 64 46V64H0Z"),
    path("M27 44V20L45 16V40"),
    path("M27 20L45 16V22L27 26Z", c.ink),
    circle(21, 44, 6, c.yellow),
    circle(39, 40, 6, c.yellow)
  ].join(""),
  gallery: [
    bg(c.yellow),
    rect(18, 14, 30, 24, 5, c.pink, ` transform="rotate(-10 33 26)"`),
    rect(16, 22, 32, 26, 5, c.blue),
    `<g clip-path="url(#rbw-gallery-card)">` +
      circle(40, 30, 3.5, c.paper) +
      path("M14 50l11-12 7 7 5-5 13 12z", c.green) +
      `</g>`,
    rect(16, 22, 32, 26, 5)
  ].join(""),
  photo: [
    bg(c.pink),
    group(
      "rotate(-6 32 32)",
      rect(15, 12, 34, 40, 4, c.paper) +
        rect(19.5, 16.5, 25, 23, 2, c.blue, ` stroke="none"`) +
        `<g clip-path="url(#rbw-photo-pic)">` +
        circle(38, 23, 3.5, c.yellow) +
        path("M16 42l10-12 7 7 4-4 10 11z", c.green) +
        `</g>` +
        rect(19.5, 16.5, 25, 23, 2)
    )
  ].join(""),
  camera: [
    bg(c.yellow),
    path("M24 22l3-5h10l3 5", c.coral),
    rect(12, 22, 40, 27, 6, c.blue),
    circle(32, 35.5, 8.5, c.paper),
    dot(32, 35.5, 3),
    dot(45.5, 28, 2)
  ].join(""),
  video: [
    bg(c.purple),
    path("M42 30l10-6v18l-10-6z", c.yellow),
    rect(11, 21, 32, 24, 6, c.coral),
    path("M23 27.5v11l9-5.5z", c.paper)
  ].join(""),
  microphone: [
    bg(c.green),
    path("M19 30a13 13 0 0 0 26 0M32 43v7M25 50h14"),
    rect(25, 11, 14, 25, 7, c.pink),
    path("M29 20h6M29 26h6")
  ].join(""),
  headphones: [
    bg(c.yellow),
    tube("M18 38v-6a14 14 0 0 1 28 0v6", c.pink),
    rect(12, 34, 12, 17, 5, c.blue),
    rect(40, 34, 12, 17, 5, c.blue)
  ].join(""),
  game: [
    bg(c.blue),
    hill(c.paper, "M0 50C20 44 44 56 64 48V64H0Z"),
    path(
      "M22 21h20a10 10 0 0 1 9.7 7.6l2.9 11.6a5 5 0 0 1-8.6 4.6L41 40H23l-5 4.8a5 5 0 0 1-8.6-4.6l2.9-11.6A10 10 0 0 1 22 21z",
      c.yellow
    ),
    path("M22 26.5v8M18 30.5h8"),
    dot(40, 28, 2.5),
    dot(45, 33, 2.5)
  ].join(""),
  palette: [
    bg(c.pink),
    path(
      "M32 13c11 0 20 7.5 20 16.5 0 5.5-4 8.5-9 7.5-3.5-.7-6.5 1.6-5.2 5.2 1.8 4.8-1.4 8.8-6.8 8.8-11 0-19-8.5-19-19S21 13 32 13z",
      c.paper
    ),
    circle(22.5, 27, 3.5, c.blue),
    circle(31, 20.5, 3.5, c.yellow),
    circle(41, 22, 3.5, c.green),
    circle(22, 38.5, 3.5, c.coral)
  ].join(""),
  brush: [
    bg(c.blue),
    tube("M9 53c5-3 9-3 14 0", c.coral),
    group(
      "rotate(35 32 32)",
      rect(28.5, 8, 7, 22, 3.5, c.yellow) +
        rect(27, 29, 10, 7, 1.5, c.paper) +
        path("M27 36h10v3c0 6-2.5 9.5-5 13-2.5-3.5-5-7-5-13z", c.coral)
    )
  ].join(""),

  // Work
  calendar: [
    bg(c.paper),
    rect(0, 0, 64, 21, 0, c.rose, ` stroke="none"`),
    path("M0 21h64"),
    dot(22, 13.5, 2.5),
    dot(42, 13.5, 2.5),
    [18, 32, 46].map((x) => circle(x, 31, 3.5, c.pink, ` stroke="none"`)).join(""),
    [18, 46].map((x) => circle(x, 44, 3.5, c.pink, ` stroke="none"`)).join(""),
    circle(32, 44, 5.5, c.yellow)
  ].join(""),
  clock: [
    bg(c.pink),
    circle(20.5, 19, 5.5, c.yellow),
    circle(43.5, 19, 5.5, c.yellow),
    path("M22 47l-3 5M42 47l3 5"),
    circle(32, 35, 15, c.paper),
    path("M32 27v8h6")
  ].join(""),
  folder: [
    bg(c.blue),
    path("M12 20a3 3 0 0 1 3-3h9l4 4h21a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z", c.coral),
    rect(17, 24, 30, 14, 2, c.paper),
    path("M12 30a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z", c.yellow)
  ].join(""),
  document: [
    bg(c.purple),
    path("M19 12h17l10 10v28a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z", c.paper),
    path("M36 12v10h10", c.sand),
    path("M23 31h17M23 38h17M23 45h10")
  ].join(""),
  clipboard: [
    bg(c.green),
    rect(14, 15, 36, 38, 5, c.tan),
    rect(20, 22, 24, 25, 2, c.paper),
    rect(25, 11, 14, 8, 3, c.yellow),
    path("M24 29.5l2 2 3.5-3.5M33 30h7M24 39.5l2 2 3.5-3.5M33 40h7")
  ].join(""),
  notes: [
    bg(c.blue),
    rect(16, 14, 32, 38, 4, c.yellow),
    path("M16 22h32"),
    path("M23 10.5v7M32 10.5v7M41 10.5v7"),
    path("M22 30h20M22 37h20M22 44h11")
  ].join(""),
  book: [
    bg(c.yellow),
    path("M10 20v27c8-1.5 16-1 22 3 6-4 14-4.5 22-3V20z", c.coral),
    path("M32 20c-5-4-12-5-18-4v28c6-1 13 0 18 3z", c.paper),
    path("M32 20c5-4 12-5 18-4v28c-6-1-13 0-18 3z", c.paper),
    path("M32 20v27")
  ].join(""),
  graduation: [
    bg(c.blue),
    path("M21 30v9c0 3 5 5.5 11 5.5s11-2.5 11-5.5v-9", c.purpleDeep),
    path("M32 15L53 25 32 35 11 25Z", c.purple),
    path("M32 25l13 4v10"),
    rect(42, 38, 6, 8, 2, c.yellow)
  ].join(""),
  briefcase: [
    bg(c.pink),
    path("M25 22v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4"),
    rect(11, 22, 42, 27, 5, c.tan),
    path("M11 33h42"),
    rect(28, 29.5, 8, 7, 2, c.yellow)
  ].join(""),
  calculator: [
    bg(c.yellow),
    rect(15, 10, 34, 44, 7, c.blue),
    rect(20, 15, 24, 11, 2.5, c.paper),
    path("M20 36h6M23 33v6M38 36h6M20.5 44.5l5 5M25.5 44.5l-5 5M38 45h6M38 49h6")
  ].join(""),
  bookmark: [
    bg(c.green),
    rect(14, 18, 36, 30, 4, c.paper),
    path("M20 26h10M20 33h10M20 40h6"),
    path("M34 12h10a2 2 0 0 1 2 2v38l-7-6-7 6V14a2 2 0 0 1 2-2z", c.coral)
  ].join(""),
  tag: [
    bg(c.yellow),
    path("M15 15h16l19 19-16 16-19-19z", c.pink),
    circle(22.5, 22.5, 3, c.yellow)
  ].join(""),
  flag: [
    bg(c.green),
    path("M20 16c8-4 14 4 24 0v18c-10 4-16-4-24 0z", c.coral),
    path("M20 13v39")
  ].join(""),
  search: [
    bg(c.blue),
    rect(-4.5, 0, 9, 17, 4.5, c.yellow, ` transform="translate(36 36) rotate(-45)"`),
    circle(27.5, 27.5, 11.5, c.paper),
    path("M21.5 25a6.5 6.5 0 0 1 4-4.5")
  ].join(""),

  // Data and tech
  chart: [
    bg(c.blue),
    rect(15, 32, 8, 15, 3, c.pink),
    rect(28, 22, 8, 25, 3, c.yellow),
    rect(41, 15, 8, 32, 3, c.paper)
  ].join(""),
  "pie-chart": [
    bg(c.purple),
    circle(32, 32, 17, c.paper),
    path("M32 32V15a17 17 0 0 1 16.2 22.2z", c.yellow),
    path("M32 32l16.2 5.2A17 17 0 0 1 22 45.8z", c.pink)
  ].join(""),
  target: [
    bg(c.blue),
    circle(29, 35, 17, c.coral),
    circle(29, 35, 11, c.paper),
    circle(29, 35, 5, c.coral),
    path("M29 35L42 22"),
    path("M42 22V16l4-4v6zM42 22h6l4-4h-6z", c.yellow)
  ].join(""),
  code: [
    bg(c.purple),
    rect(11, 14, 42, 36, 6, c.paper),
    path("M11 20a6 6 0 0 1 6-6h30a6 6 0 0 1 6 6v3H11z", c.yellow),
    path("M11 23h42"),
    path("M19 31l5 4.5-5 4.5M29 42h10")
  ].join(""),
  database: [
    bg(c.yellow),
    path("M17 19v26c0 3 6.7 5.5 15 5.5S47 48 47 45V19", c.blue),
    path("M17 28c0 3 6.7 5.5 15 5.5S47 31 47 28M17 37c0 3 6.7 5.5 15 5.5S47 40 47 37"),
    `<ellipse cx="32" cy="19" rx="15" ry="5.5" fill="${c.paper}"/>`
  ].join(""),
  server: [
    bg(c.blue),
    rect(13, 14, 38, 15, 4.5, c.paper),
    rect(13, 35, 38, 15, 4.5, c.paper),
    circle(21, 21.5, 2.8, c.green, ` stroke="none"`),
    circle(21, 42.5, 2.8, c.coral, ` stroke="none"`),
    path("M33 21.5h11M33 42.5h11")
  ].join(""),
  bug: [
    bg(c.green),
    path("M22 31h-6M22 39l-6 3M22 47l-5 4M42 31h6M42 39l6 3M42 47l5 4M28 19l-3-5M36 19l3-5"),
    circle(32, 23, 6, c.ink),
    `<ellipse cx="32" cy="38" rx="11" ry="13.5" fill="${c.coral}"/>`,
    path("M32 25v26"),
    dot(26.5, 35, 2.2),
    dot(37.5, 35, 2.2),
    dot(27, 43.5, 2.2),
    dot(37, 43.5, 2.2)
  ].join(""),
  puzzle: [
    bg(c.green),
    path(
      "M14 22H24A4.5 4.5 0 1 1 32 22H42V32A4.5 4.5 0 1 1 42 40V50H14V40A4.5 4.5 0 1 0 14 32Z",
      c.yellow
    )
  ].join(""),
  rocket: [
    bg(c.purple),
    path(sparkle(16, 18, 6), c.paper),
    dot(47, 50, 1.8),
    dot(16, 46, 1.8),
    group(
      "rotate(40 32 32)",
      path("M27 43h10l-2 8-3-3-3 3z", c.yellow) +
        path("M25 32l-6 7v6l6-3zM39 32l6 7v6l-6-3z", c.coral) +
        path("M32 10c7 5 9 15 7.5 32h-15C23 25 25 15 32 10z", c.paper) +
        circle(32, 25, 4, c.blue)
    )
  ].join(""),
  lightbulb: [
    bg(c.blue),
    path("M32 11a13 13 0 0 0-8 23.3V40h16v-5.7A13 13 0 0 0 32 11z", c.yellow),
    path("M28.5 31l3.5 3 3.5-3"),
    rect(25, 40, 14, 7, 2.5, c.paper),
    path("M28.5 51.5h7")
  ].join(""),
  gear: [bg(c.blue), path(cog(32, 32, 19, 14.5, 8), c.yellow), circle(32, 32, 6, c.paper)].join(""),
  bolt: [
    bg(c.yellow),
    circle(54, 54, 20, c.coral),
    path("M35 12 20 35h11l-3 17 16-24H33z", c.paper)
  ].join(""),

  // Security
  lock: [
    bg(c.green),
    hill(c.paper),
    path("M24 29v-5a8 8 0 0 1 16 0v5"),
    rect(19, 29, 26, 20, 6, c.yellow),
    path("M32 36v6")
  ].join(""),
  unlock: [
    bg(c.pink),
    hill(c.paper),
    path("M40 29V22a8 8 0 0 0-16 0v1"),
    rect(19, 29, 26, 20, 6, c.yellow),
    path("M32 36v6")
  ].join(""),
  key: [
    bg(c.yellow),
    group(
      "rotate(45 32 32)",
      rect(37, 32, 5, 8, 1.5, c.coral) +
        rect(44, 32, 5, 6, 1.5, c.coral) +
        rect(24, 28, 28, 7, 2.5, c.coral) +
        circle(18, 31.5, 9, c.coral) +
        circle(16, 31.5, 3, c.yellow)
    )
  ].join(""),
  shield: [
    bg(c.blue),
    path("M32 12l16 6v11c0 11-7 18-16 22-9-4-16-11-16-22V18z", c.green),
    path("M25 31.5l5 5 10-10")
  ].join(""),

  // Shopping
  cart: [
    bg(c.yellow),
    path("M19 23h32l-4 15H23z", c.paper),
    path("M11 17h5l7 21h24"),
    circle(25, 46, 3.5, c.blue),
    circle(43, 46, 3.5, c.blue)
  ].join(""),
  bag: [
    bg(c.pink),
    path("M16 24h32l-2 25a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3z", c.yellow),
    path("M25 30v-7a7 7 0 0 1 14 0v7"),
    dot(25, 30, 2),
    dot(39, 30, 2)
  ].join(""),
  wallet: [
    bg(c.green),
    rect(17, 13, 26, 14, 3, c.blue, ` transform="rotate(-8 30 20)"`),
    rect(11, 20, 42, 29, 6, c.coral),
    path("M53 29H43a5.5 5.5 0 0 0 0 11h10z", c.yellow),
    dot(43, 34.5, 2)
  ].join(""),
  "credit-card": [
    bg(c.blue),
    rect(11, 17, 42, 30, 5, c.yellow),
    path("M11 26h42"),
    rect(17, 33, 9, 7, 2, c.pink),
    path("M32 39h14")
  ].join(""),

  // Places and travel
  home: [
    bg(c.green),
    rect(18, 30, 28, 20, 2, c.paper),
    path("M27 50V41a5 5 0 0 1 10 0v9", c.yellow),
    path("M12 32L32 15 52 32Z", c.coral)
  ].join(""),
  "map-pin": [
    bg(c.green),
    `<ellipse cx="32" cy="51" rx="10" ry="3" fill="${c.greenDeep}"/>`,
    path("M32 51S17 38 17 27a15 15 0 0 1 30 0c0 11-15 24-15 24z", c.coral),
    circle(32, 27, 5.5, c.paper)
  ].join(""),
  map: [
    bg(c.pink),
    path("M12 19l13-5v32l-13 5z", c.green),
    path("M25 14l14 5v32l-14-5z", c.yellow),
    path("M39 19l13-5v32l-13 5z", c.blue),
    circle(36, 30, 3.5, c.coral)
  ].join(""),
  car: [
    bg(c.pink),
    hill(c.paper, "M0 48h64V64H0Z"),
    path(
      "M12 42v-7a4 4 0 0 1 3-3.9l4.2-9.4a4 4 0 0 1 3.7-2.4h18.2a4 4 0 0 1 3.7 2.4l4.2 9.4a4 4 0 0 1 3 3.9v7z",
      c.blue
    ),
    path("M24 24h16l3.5 8h-23z", c.paper),
    circle(21.5, 43, 5, c.yellow),
    circle(42.5, 43, 5, c.yellow)
  ].join(""),
  plane: [
    bg(c.blue),
    group(
      "rotate(45 32 32)",
      path("M28 24L10 36v6l18-5zM36 24l18 12v6l-18-5z", c.coral) +
        path("M28.5 45l-7 5v4l7-2zM35.5 45l7 5v4l-7-2z", c.coral) +
        rect(27, 8, 10, 47, 5, c.paper) +
        path("M32 14v4")
    )
  ].join(""),
  globe: [
    bg(c.purple),
    circle(32, 32, 18, c.blue),
    `<g clip-path="url(#rbw-globe-sea)">` +
      path("M13 22c5-3 10-2 12 2s-1 6 1 9-2 7-6 7-9-4-9-9 0-7 2-9z", c.green) +
      path(
        "M36 15c5 1 9 3 11 7s-3 4-5 3-4 2-2 5 6 2 7 6-4 9-8 10c1-5-2-8-5-10s-2-7 0-9-5-5 2-12z",
        c.green
      ) +
      `</g>`,
    circle(32, 32, 18)
  ].join(""),

  // Nature
  cloud: [
    bg(c.blue),
    circle(45, 21, 8, c.yellow),
    puff(
      `<circle cx="22" cy="37" r="7"/><circle cx="33" cy="30" r="10"/><circle cx="43" cy="36" r="8"/>` +
        `<rect x="22" y="34" width="21" height="10"/>`,
      c.paper
    )
  ].join(""),
  sun: [
    bg(c.blue),
    path(
      [0, 45, 90, 135, 180, 225, 270, 315]
        .map((a) => {
          const t = (a * Math.PI) / 180;
          const p = (r: number) => `${r1(32 + r * Math.cos(t))} ${r1(32 + r * Math.sin(t))}`;
          return `M${p(15.5)}L${p(20.5)}`;
        })
        .join("")
    ),
    circle(32, 32, 10.5, c.yellow),
    dot(28.5, 31, 1.6),
    dot(35.5, 31, 1.6)
  ].join(""),
  moon: [
    bg(c.purpleDeep),
    path("M29.2 16A17 17 0 1 0 46.3 38A14 14 0 0 1 29.2 16Z", c.yellow),
    path(sparkle(46, 18, 6), c.paper),
    dot(50, 30, 2)
  ].join(""),
  rain: [
    bg(c.blue),
    puff(
      `<circle cx="23" cy="27" r="7"/><circle cx="33" cy="21" r="9"/><circle cx="42" cy="27" r="7"/>` +
        `<rect x="23" y="24" width="19" height="10"/>`,
      c.paper
    ),
    drop(23, 40, c.blueDeep),
    drop(33, 43, c.blueDeep),
    drop(43, 40, c.blueDeep)
  ].join(""),
  plant: [
    bg(c.yellow),
    path("M32 36V24"),
    path("M32 28c-2-7-9-9.5-14-7.5 1 6 7 9.5 14 7.5z", c.green),
    path("M32 24c1-7 8-10 14-8-1 6-7 10-14 8z", c.green),
    path("M22 40h20l-2.5 10a2.5 2.5 0 0 1-2.4 2H26.9a2.5 2.5 0 0 1-2.4-2z", c.coral),
    rect(19.5, 35, 25, 6, 2, c.coral)
  ].join(""),
  cactus: [
    bg(c.pink),
    tube("M26 33h-3.5a3 3 0 0 1-3-3v-6", c.green),
    tube("M38 28h3.5a3 3 0 0 0 3-3v-4", c.green),
    rect(26, 12, 12, 30, 6, c.green),
    path("M22 42h20l-2.5 8a2.5 2.5 0 0 1-2.4 2H26.9a2.5 2.5 0 0 1-2.4-2z", c.tan),
    rect(19.5, 38, 25, 6, 2, c.tan)
  ].join(""),
  sparkles: [
    bg(c.purple),
    path(sparkle(27, 35, 16), c.yellow),
    path(sparkle(45, 18, 7), c.paper),
    path(sparkle(46, 45, 5), c.pink)
  ].join(""),

  // Food and fun
  coffee: [
    bg(c.pink),
    path("M24 17c-2-2 2-4 0-6M32 17c-2-2 2-4 0-6"),
    path("M42 28h3a6 6 0 0 1 0 12h-3"),
    path("M15 23h27v16a9 9 0 0 1-9 9h-9a9 9 0 0 1-9-9z", c.paper),
    path("M15 29h27", "none", ` stroke="${c.tan}" stroke-width="3"`),
    path("M15 23h27v16a9 9 0 0 1-9 9h-9a9 9 0 0 1-9-9z")
  ].join(""),
  pizza: [
    bg(c.green),
    path("M32 52L15 19c11-6 23-6 34 0z", c.yellow),
    path("M15 19c11-6 23-6 34 0l-2.6 5c-9.5-5-19.3-5-28.8 0z", c.tan),
    circle(27, 31, 3.5, c.coral),
    circle(37.5, 32, 3.5, c.coral),
    circle(31.5, 41, 3, c.coral)
  ].join(""),
  dog: [
    bg(c.yellow),
    circle(32, 35, 14, c.paper),
    path("M21 23c-6-1-9 7-7 15 4 1 7-3 8-7z", c.tan),
    path("M43 23c6-1 9 7 7 15-4 1-7-3-8-7z", c.tan),
    dot(27, 34, 2.2),
    dot(37, 34, 2.2),
    `<ellipse cx="32" cy="40" rx="3.2" ry="2.4" fill="${c.ink}" stroke="none"/>`,
    path("M29 44.5c1.5 1.5 4.5 1.5 6 0")
  ].join(""),
  cat: [
    bg(c.blue),
    path(
      "M15 39c0-7 2.5-11 2.5-11L17 13l10 7c1.7-.4 3.4-.6 5-.6s3.3.2 5 .6l10-7-.5 15s2.5 4 2.5 11c0 7-7.5 12-17 12s-17-5-17-12z",
      c.paper
    ),
    circle(21.5, 40, 2.8, c.pink, ` stroke="none"`),
    circle(42.5, 40, 2.8, c.pink, ` stroke="none"`),
    dot(26, 34, 2.2),
    dot(38, 34, 2.2),
    path("M30.5 39.5h3l-1.5 1.5z", c.ink),
    path("M10 37l6 1M10 43l6-1.5M54 37l-6 1M54 43l-6-1.5")
  ].join(""),
  dice: [
    bg(c.purple),
    group(
      "rotate(-8 32 32)",
      rect(15, 15, 34, 34, 8, c.paper) +
        dot(23.5, 23.5, 3) +
        dot(40.5, 23.5, 3) +
        dot(32, 32, 3) +
        dot(23.5, 40.5, 3) +
        dot(40.5, 40.5, 3)
    )
  ].join(""),

  // Status
  check: [bg(c.green), circle(32, 32, 17, c.paper), path("M24 32.5l6 6 11-12")].join(""),
  warning: [
    bg(c.pink),
    path("M28.5 16.5Q32 11 35.5 16.5L50.5 43Q53 48.5 47 48.5H17Q11 48.5 13.5 43Z", c.yellow),
    path("M32 25v10"),
    dot(32, 42, 2.3)
  ].join(""),
  info: [bg(c.blue), circle(32, 32, 17, c.paper), dot(32, 24, 2.5), path("M32 31v11")].join(""),
  help: [
    bg(c.purple),
    circle(32, 32, 17, c.paper),
    path("M26.5 27a5.5 5.5 0 1 1 8 4.9c-1.6.8-2.5 2-2.5 3.6v.5"),
    dot(32, 42.5, 2.3)
  ].join(""),
  upload: [
    bg(c.green),
    rect(13, 38, 38, 13, 4, c.paper),
    path("M32 11l12 12h-7v12H27V23h-7z", c.yellow),
    dot(44, 44.5, 2)
  ].join(""),
  download: [
    bg(c.blue),
    rect(13, 38, 38, 13, 4, c.paper),
    path("M27 11h10v12h7L32 35 20 23h7z", c.yellow),
    dot(44, 44.5, 2)
  ].join(""),
  trash: [
    bg(c.pink),
    path("M27 17v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"),
    path("M18 23h28l-2.6 26a3 3 0 0 1-3 2.7H23.6a3 3 0 0 1-3-2.7z", c.paper),
    rect(14, 17, 36, 7, 3, c.coral),
    path("M28 30v15M36 30v15")
  ].join(""),

  // Brand
  logo: [
    bg(c.blue),
    path("M8 42a24 24 0 0 1 48 0z", c.pink),
    path("M14 42a18 18 0 0 1 36 0z", c.yellow),
    path("M20 42a12 12 0 0 1 24 0z", c.green),
    path("M26 42a6 6 0 0 1 12 0z", c.blue),
    puff(
      `<circle cx="14" cy="44" r="5"/><circle cx="21" cy="42" r="6"/><rect x="11" y="42" width="16" height="7" rx="3.5"/>`,
      c.paper
    ),
    puff(
      `<circle cx="50" cy="44" r="5"/><circle cx="43" cy="42" r="6"/><rect x="37" y="42" width="16" height="7" rx="3.5"/>`,
      c.paper
    )
  ].join("")
};

/** Extra clip paths some tiles need, keyed by tile name. */
const tileDefs: Record<string, string> = {
  gallery: `<clipPath id="rbw-gallery-card">${rect(16, 22, 32, 26, 5)}</clipPath>`,
  photo: `<clipPath id="rbw-photo-pic">${rect(19.5, 16.5, 25, 23, 2)}</clipPath>`,
  globe: `<clipPath id="rbw-globe-sea">${circle(32, 32, 18)}</clipPath>`
};

// ── Spot illustrations ────────────────────────────────────────────────────
const ground = (color: string) => path("M0 90C40 82 120 82 160 90V120H0Z", color);
const confetti = (x: number, y: number, a: number, color: string) =>
  rect(-6, -3, 12, 6, 2, color, ` transform="translate(${x} ${y}) rotate(${a})"`);

const spots: Record<string, string> = {
  "empty-inbox": spot(
    "empty-inbox",
    c.blue,
    ground(c.green),
    [
      path("M48 64l12-30h40l12 30v18a6 6 0 0 1-6 6H54a6 6 0 0 1-6-6z", c.paper),
      path("M48 64h22l4 8h12l4-8h22v18a6 6 0 0 1-6 6H54a6 6 0 0 1-6-6z", c.yellow),
      path("M66 46h28M62 55h36"),
      path("M36 34l-5-4M34 46h-6M124 34l5-4M126 46h6"),
      path(sparkle(122, 70, 6), c.paper)
    ].join("")
  ),
  "no-results": spot(
    "no-results",
    c.yellow,
    ground(c.green),
    [
      group(
        "rotate(-6 64 52)",
        rect(40, 22, 46, 60, 6, c.paper) + path("M50 36h26M50 46h26M50 56h16")
      ),
      rect(-5, 0, 10, 26, 5, c.coral, ` transform="translate(107 71) rotate(-45)"`),
      circle(94, 58, 19, c.cream),
      path("M88 53a6 6 0 1 1 9 5.2c-1.8 1-3 2.2-3 4.3v.5"),
      dot(94, 68.5, 2.5)
    ].join("")
  ),
  success: spot(
    "success",
    c.pink,
    "",
    [
      path("M68 76l-7 22 8-4 5 7 6-21zM92 76l7 22-8-4-5 7-6-21z", c.coral),
      circle(80, 56, 26, c.green),
      tube("M68 56l8 8 16-16", c.paper, 5),
      confetti(36, 40, 30, c.yellow),
      confetti(124, 36, -25, c.blue),
      confetti(40, 76, -20, c.purple),
      confetti(122, 78, 35, c.yellow),
      path(sparkle(50, 24, 7), c.yellow),
      path(sparkle(112, 20, 5), c.paper),
      dot(30, 58, 2.2),
      dot(130, 58, 2.2)
    ].join("")
  ),
  error: spot(
    "error",
    c.purple,
    ground(c.pink),
    [
      path("M79 24H46a8 8 0 0 0-8 8v46a8 8 0 0 0 8 8H77L81 74 75 62 83 50 73 38Z", c.paper),
      path("M40 34h35.5"),
      dot(47, 29, 2),
      dot(54, 29, 2),
      path("M54 52l6 6M60 52l-6 6"),
      group(
        "translate(8 5) rotate(5 100 55)",
        path("M79 24L73 38 83 50 75 62 81 74 77 86H112a8 8 0 0 0 8-8V32a8 8 0 0 0-8-8Z", c.paper) +
          path("M76 34H120") +
          path("M96 52l6 6M102 52l-6 6") +
          path("M88 72c3-3 8-3 11 0")
      ),
      path("M62 72c3-3 7-3 10-1")
    ].join("")
  ),
  offline: spot(
    "offline",
    c.blue,
    ground(c.sand) + tube("M104 64c14 0 18 10 18 18s6 14 40 14", c.yellow),
    [
      rect(28, 36, 36, 46, 9, c.paper),
      path("M40 52v10M52 52v10"),
      path("M42 72c2-2 6-2 8 0"),
      path("M86 56h-9M86 70h-9"),
      rect(84, 50, 22, 26, 6, c.yellow),
      dot(91, 60, 2),
      dot(99, 60, 2),
      path("M92 68c2-2 4-2 6 0"),
      path("M70 44l-3-5M72 63h-6M70 82l-3 5")
    ].join("")
  ),
  lost: spot(
    "lost",
    c.blue,
    ground(c.green),
    [
      rect(76, 30, 8, 62, 3, c.tan),
      path("M46 32h36v16H46l-8-8z", c.yellow),
      path("M78 54h36l8 8-8 8H78z", c.pink),
      path("M70 92c0-4 2-6 4-7M90 92c0-4-2-6-4-7"),
      path("M115 27a5 5 0 1 1 7.4 4.4c-1.4.7-2.4 1.8-2.4 3.2"),
      dot(120, 41, 2.2),
      path(sparkle(40, 66, 5), c.paper)
    ].join("")
  ),
  "all-caught-up": spot(
    "all-caught-up",
    c.yellow,
    ground(c.green),
    [
      rect(54, 24, 52, 70, 8, c.tan),
      rect(62, 34, 36, 52, 3, c.paper),
      rect(68, 18, 24, 12, 4, c.blue),
      [46, 60, 74].map((y) => path(`M68 ${y}l3 3 6-6M82 ${y}h10`)).join(""),
      path(sparkle(34, 40, 8), c.paper),
      path(sparkle(126, 50, 6), c.pink),
      dot(122, 30, 2.2),
      dot(38, 70, 2.2)
    ].join("")
  ),
  welcome: spot(
    "welcome",
    c.purple,
    ground(c.green) +
      puff(
        `<circle cx="56" cy="92" r="10"/><circle cx="70" cy="96" r="12"/>` +
          `<circle cx="90" cy="96" r="12"/><circle cx="104" cy="92" r="10"/>`,
        c.paper
      ),
    [
      path("M70 66h20l-4 14-6-6-6 6z", c.yellow),
      path("M64 50l-12 14v10l12-6zM96 50l12 14v10l-12-6z", c.coral),
      path("M80 16c14 10 18 28 15 50H65c-3-22 1-40 15-50z", c.paper),
      circle(80, 40, 7, c.blue),
      path(sparkle(38, 36, 7), c.yellow),
      path(sparkle(124, 30, 5), c.paper),
      dot(118, 56, 2.2),
      dot(44, 60, 2.2)
    ].join("")
  )
};

/** Every illustration, keyed by its registered name. */
export const rainbowIllustrations: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(tiles).map(([name, body]) => [
      `rainbow-${name}`,
      tile(name, body, tileDefs[name])
    ])
  ),
  ...Object.fromEntries(Object.entries(spots).map(([name, svg]) => [`rainbow-spot-${name}`, svg]))
};

const prefix = (names: string[]) => names.map((n) => `rainbow-${n}`);

/**
 * The set grouped by subject, in display order. `spots` holds the wide
 * 160×120 scenes; every other group holds 64×64 app tiles.
 */
export const rainbowIllustrationGroups: Readonly<Record<string, readonly string[]>> = {
  communication: prefix(["chat", "mail", "inbox", "send", "bell", "phone", "link"]),
  people: prefix(["user", "team", "heart", "star", "gift", "balloon", "trophy"]),
  media: prefix([
    "music",
    "gallery",
    "photo",
    "camera",
    "video",
    "microphone",
    "headphones",
    "game",
    "palette",
    "brush"
  ]),
  work: prefix([
    "calendar",
    "clock",
    "folder",
    "document",
    "clipboard",
    "notes",
    "book",
    "graduation",
    "briefcase",
    "calculator",
    "bookmark",
    "tag",
    "flag",
    "search"
  ]),
  data: prefix([
    "chart",
    "pie-chart",
    "target",
    "code",
    "database",
    "server",
    "bug",
    "puzzle",
    "rocket",
    "lightbulb",
    "gear",
    "bolt"
  ]),
  security: prefix(["lock", "unlock", "key", "shield"]),
  shopping: prefix(["cart", "bag", "wallet", "credit-card"]),
  places: prefix(["home", "map-pin", "map", "car", "plane", "globe"]),
  nature: prefix(["cloud", "sun", "moon", "rain", "plant", "cactus", "sparkles"]),
  fun: prefix(["coffee", "pizza", "dog", "cat", "dice"]),
  status: prefix(["check", "warning", "info", "help", "upload", "download", "trash"]),
  brand: prefix(["logo"]),
  spots: Object.keys(spots).map((n) => `rainbow-spot-${n}`)
};

/** Every registered name, in display order (grouped). */
export const rainbowIllustrationNames: readonly string[] =
  Object.values(rainbowIllustrationGroups).flat();

/** Register every Rainbow illustration with the shared registry. */
export function registerRainbowIllustrations(): void {
  registerIcons(rainbowIllustrations);
}
