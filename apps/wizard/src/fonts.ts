/**
 * Font picking + live Google Fonts loading for the wizard's Font step.
 *
 * Setting `--fluid-font-family-sans` re-fonts the whole system (one token,
 * inherited through every shadow root). But a non-system family only *renders*
 * once its files load, so when the user picks a Google font we inject a
 * `<link rel="stylesheet">` to fonts.googleapis.com in the document head
 * (@font-face is document-global, so it reaches every shadow). The export step
 * emits that same link so the consumer's app loads it too.
 *
 * The picker offers two bundled choices (Inter, the DS default, and the OS
 * system stack) plus *any* family from the Google Fonts library: pick a name
 * and we build its css2 `family=` query on the fly, no API key required.
 */
const SYSTEM = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export interface FontChoice {
  label: string;
  /** The full CSS font-family stack to write into --fluid-font-family-sans. */
  stack: string;
  /** Google Fonts css2 `family=` query (with weights), or null for system/bundled. */
  google: string | null;
}

/** Display names for the two non-Google quick picks. */
export const DEFAULT_FONT_NAME = "Inter (default)";
export const SYSTEM_FONT_NAME = "System UI";

/** Common UI weights requested for every Google family. */
const WEIGHTS = "wght@400;500;600;700";

/** Bundled / system fonts, no webfont fetch. Inter is the DS default. */
export const FONTS: FontChoice[] = [
  { label: DEFAULT_FONT_NAME, stack: `"Inter Variable", "Inter", ${SYSTEM}`, google: null },
  { label: SYSTEM_FONT_NAME, stack: SYSTEM, google: null }
];

/**
 * A broad slice of the most-used Google Fonts (sans, serif, display, mono).
 * Any of these loads live by name, the list is just for discoverability in
 * the typeahead; the css2 query is built from whatever name the user picks.
 */
export const GOOGLE_FAMILIES: string[] = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Noto Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans 3",
  "Raleway",
  "Nunito",
  "Nunito Sans",
  "Work Sans",
  "Rubik",
  "Mulish",
  "Manrope",
  "DM Sans",
  "Karla",
  "Inter Tight",
  "Plus Jakarta Sans",
  "Figtree",
  "Lexend",
  "Outfit",
  "Sora",
  "Space Grotesk",
  "Albert Sans",
  "Onest",
  "Geist",
  "Hanken Grotesk",
  "Schibsted Grotesk",
  "Bricolage Grotesque",
  "IBM Plex Sans",
  "IBM Plex Serif",
  "IBM Plex Mono",
  "PT Sans",
  "PT Serif",
  "Fira Sans",
  "Fira Code",
  "Cabin",
  "Quicksand",
  "Josefin Sans",
  "Barlow",
  "Barlow Condensed",
  "Heebo",
  "Assistant",
  "Titillium Web",
  "Oswald",
  "Archivo",
  "Archivo Narrow",
  "Public Sans",
  "Red Hat Display",
  "Red Hat Text",
  "Epilogue",
  "Urbanist",
  "Be Vietnam Pro",
  "Jost",
  "Spline Sans",
  "Instrument Sans",
  "Kanit",
  "Prompt",
  "Mukta",
  "Hind",
  "Dosis",
  "Comfortaa",
  "Signika",
  "Catamaran",
  "Maven Pro",
  "Exo 2",
  "Saira",
  "Chivo",
  "Overpass",
  "Asap",
  "Roboto Condensed",
  "Roboto Slab",
  "Roboto Mono",
  "Roboto Flex",
  "Merriweather",
  "Merriweather Sans",
  "Playfair Display",
  "Lora",
  "Libre Franklin",
  "Libre Baskerville",
  "Bitter",
  "Domine",
  "Crimson Text",
  "Crimson Pro",
  "EB Garamond",
  "Cormorant",
  "Cormorant Garamond",
  "Source Serif 4",
  "Noto Serif",
  "Frank Ruhl Libre",
  "Spectral",
  "Zilla Slab",
  "Arvo",
  "Vollkorn",
  "Newsreader",
  "Fraunces",
  "Petrona",
  "Literata",
  "DM Serif Display",
  "DM Serif Text",
  "Abril Fatface",
  "Bebas Neue",
  "Anton",
  "Righteous",
  "Pacifico",
  "Lobster",
  "Caveat",
  "Dancing Script",
  "Satisfy",
  "Shadows Into Light",
  "Permanent Marker",
  "Sacramento",
  "Great Vibes",
  "Courgette",
  "Teko",
  "Fjalla One",
  "Russo One",
  "Alfa Slab One",
  "Staatliches",
  "Bungee",
  "Concert One",
  "JetBrains Mono",
  "Source Code Pro",
  "Space Mono",
  "Inconsolata",
  "DM Mono",
  "Ubuntu",
  "Ubuntu Mono",
  "Nanum Gothic",
  "Noto Sans JP",
  "Noto Sans KR",
  "Noto Sans SC",
  "Noto Sans TC"
];

/** Build a CSS font-family stack for a Google family name. */
export function familyToStack(family: string): string {
  return `"${family}", ${SYSTEM}`;
}

/** Build the css2 `family=` query (common UI weights) for a Google family name. */
export function familyToQuery(family: string): string {
  return `${family.replace(/ /g, "+")}:${WEIGHTS}`;
}

export interface ResolvedFont {
  /** Value to write into --fluid-font-family-sans (empty string = DS default). */
  token: string;
  /** css2 `family=` query, or null for bundled/system. */
  google: string | null;
}

/** Resolve a picked display name to its token value + Google query. */
export function resolveFont(name: string): ResolvedFont {
  if (!name || name === DEFAULT_FONT_NAME) return { token: "", google: null };
  if (name === SYSTEM_FONT_NAME) return { token: SYSTEM, google: null };
  return { token: familyToStack(name), google: familyToQuery(name) };
}

/** Reverse a persisted token stack back to a display name for the picker. */
export function stackToName(stack: string | null | undefined): string {
  if (!stack) return DEFAULT_FONT_NAME;
  if (stack === SYSTEM) return SYSTEM_FONT_NAME;
  const m = stack.match(/^"([^"]+)"/);
  if (!m) return DEFAULT_FONT_NAME;
  if (m[1] === "Inter Variable") return DEFAULT_FONT_NAME;
  return m[1]!;
}

/** Every selectable font name, default first, for the picker's option list. */
export function allFontNames(): string[] {
  return [DEFAULT_FONT_NAME, SYSTEM_FONT_NAME, ...GOOGLE_FAMILIES];
}

const LINK_ID = "fluid-wizard-gfont";

/** Inject / replace / remove the live Google Fonts <link> in the document head. */
export function loadGoogleFont(query: string | null): void {
  let el = document.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (!query) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.id = LINK_ID;
    el.rel = "stylesheet";
    document.head.appendChild(el);
  }
  el.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
}

/** The <link> tag string for the export snippet (or null if a system/bundled font). */
export function googleFontLink(query: string | null): string | null {
  if (!query) return null;
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${query}&display=swap" />`;
}
