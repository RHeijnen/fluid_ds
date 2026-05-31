/**
 * Drop-in theme picker rendered in the demo shell's header. Lets the
 * viewer swap brand + scheme to confirm that the same demo looks right
 * under every preset, the real-world test of "does the theming
 * system actually flow?".
 *
 * Implementation: tiny custom element wrapping a `<fluid-segmented-control>`
 * for the scheme and a `<fluid-select>` for the brand. State is mirrored
 * into `<html>` attributes (`data-fluid-theme`, `data-fluid-brand`)
 * which is how every Fluid component picks up the switch.
 *
 * State persists to `localStorage` so refreshing keeps the choice:
 * convenient when iterating on a single demo.
 */

const SCHEME_KEY = "fluid-demos-scheme";
const BRAND_KEY = "fluid-demos-brand";

type Scheme = "light" | "dark";

interface Brand {
  id: string;
  label: string;
}

const BRANDS: Brand[] = [
  { id: "default", label: "Default" },
  { id: "midnight", label: "Midnight" },
  { id: "corporate", label: "Corporate" }
];

function applyScheme(scheme: Scheme): void {
  document.documentElement.setAttribute("data-fluid-theme", scheme);
}

function applyBrand(brand: string): void {
  if (brand === "default") {
    document.documentElement.removeAttribute("data-fluid-brand");
  } else {
    document.documentElement.setAttribute("data-fluid-brand", brand);
  }
}

/**
 * Build the picker DOM and append it to the parent passed in. Returns
 * the host element so callers can position it in the page chrome.
 */
export function mountThemePicker(parent: HTMLElement): HTMLElement {
  const host = document.createElement("div");
  host.className = "demo-theme-picker";

  // Scheme, segmented control (light/dark).
  const schemeWrap = document.createElement("div");
  const scheme = (localStorage.getItem(SCHEME_KEY) as Scheme | null) ?? "light";
  schemeWrap.innerHTML = `
    <fluid-segmented-control value="${scheme}" aria-label="Color scheme">
      <fluid-segment value="light">Light</fluid-segment>
      <fluid-segment value="dark">Dark</fluid-segment>
    </fluid-segmented-control>
  `;
  schemeWrap.addEventListener("fluid-change", (e) => {
    const next = (e as CustomEvent).detail.value as Scheme;
    localStorage.setItem(SCHEME_KEY, next);
    applyScheme(next);
  });

  // Brand, select.
  const brandWrap = document.createElement("div");
  const brand = localStorage.getItem(BRAND_KEY) ?? "default";
  const opts = BRANDS.map(
    (b) =>
      `<fluid-option value="${b.id}"${b.id === brand ? " selected" : ""}>${b.label}</fluid-option>`
  ).join("");
  brandWrap.innerHTML = `
    <fluid-select size="sm" value="${brand}" aria-label="Brand">${opts}</fluid-select>
  `;
  brandWrap.addEventListener("fluid-change", (e) => {
    const next = (e as CustomEvent).detail.value as string;
    localStorage.setItem(BRAND_KEY, next);
    applyBrand(next);
  });

  host.appendChild(schemeWrap);
  host.appendChild(brandWrap);
  parent.appendChild(host);

  // Apply persisted values immediately on mount.
  applyScheme(scheme);
  applyBrand(brand);

  return host;
}
