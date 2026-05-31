/**
 * Programmatically constructs the shared shell, a header that mirrors
 * the landing's `site-nav` (same brand mark + same primary nav links
 * + GitHub CTA) so navigating between `/` and `/demos/` doesn't cause
 * the header to jump shape, plus a sidebar with cross-demo links and
 * the theme picker. Each demo entry calls `mountShell` with its title
 * + `currentRoute` so the active sidebar item highlights.
 *
 * In-demo links are built off `import.meta.env.BASE_URL` so they
 * resolve correctly both in dev (where the demos app is rooted at `/`)
 * and in the unified website (where it's rooted at `/demos/`). The
 * previous relative-path approach (`../settings/`) 404'd from the
 * picker page in production because `../` from `/demos/index.html`
 * climbs out to `/`, putting the link at `/settings/` instead of
 * `/demos/settings/`.
 *
 * Cross-surface links (Docs / Storybook / Theme builder / Landing)
 * are absolute against the unified website root, they're not
 * reachable in standalone `pnpm demos` dev, which is accepted.
 */
import { mountThemePicker } from "./theme-picker.js";

export interface ShellOptions {
  title: string;
  /** One of `index`, `settings`, `admin`, drives sidebar `aria-current`. */
  currentRoute: "index" | "settings" | "admin";
}

/** Vite substitutes this at build time: `/` in dev, `/demos/` in prod. */
const BASE = import.meta.env.BASE_URL;

/** Sidebar routes, within the demos app, prefixed by BASE. */
const DEMO_ROUTES: { id: ShellOptions["currentRoute"]; href: string; label: string }[] = [
  { id: "index", href: BASE, label: "All demos" },
  { id: "settings", href: `${BASE}settings/`, label: "Settings dashboard" },
  { id: "admin", href: `${BASE}admin/`, label: "Admin / data" }
];

/** Cross-surface nav (matches the landing's primary nav). */
const SURFACE_LINKS: { href: string; label: string; current?: boolean }[] = [
  { href: "/docs/", label: "Docs" },
  { href: "/storybook/", label: "Storybook" },
  { href: "/playground/", label: "Theme builder" },
  { href: "/demos/", label: "Demos", current: true }
];

export function mountShell(opts: ShellOptions): HTMLElement {
  const shell = document.createElement("div");
  shell.className = "demo-shell";

  // Header, same structural shape as the landing's `.site-nav` so
  // there's no layout jump when navigating between root and /demos/.
  const header = document.createElement("header");
  header.className = "site-nav";
  header.innerHTML = `
    <a class="brand" href="/">
      <svg class="brand-mark" viewBox="0 0 96 96" aria-hidden="true">
        <defs>
          <linearGradient id="fluidLogoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#3b82f6"></stop>
            <stop offset="1" stop-color="#22d3ee"></stop>
          </linearGradient>
          <clipPath id="fluidLogoClip"><rect width="96" height="96" rx="22"></rect></clipPath>
        </defs>
        <g clip-path="url(#fluidLogoClip)">
          <rect width="96" height="96" fill="url(#fluidLogoGrad)"></rect>
          <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">
            <path d="M-6,40 C12,30 26,50 44,40 S72,30 102,40" opacity="0.95"></path>
            <path d="M-6,58 C12,48 26,68 44,58 S72,48 102,58" opacity="0.65"></path>
            <path d="M-6,76 C12,66 26,86 44,76 S72,66 102,76" opacity="0.35"></path>
          </g>
        </g>
      </svg>
      <span>Fluid</span>
    </a>
    <nav class="primary" aria-label="Primary">
      ${SURFACE_LINKS.map(
        (s) =>
          `<a href="${s.href}"${s.current ? ' aria-current="page"' : ""}>${s.label}</a>`
      ).join("")}
      <a class="cta" href="https://github.com/RHeijnen/fluid_ds" target="_blank" rel="noopener">
        <fluid-button size="sm" variant="secondary">
          GitHub
          <fluid-icon slot="suffix" name="external-link"></fluid-icon>
        </fluid-button>
      </a>
    </nav>
    <div class="picker-host" aria-label="Theme controls"></div>
  `;
  mountThemePicker(header.querySelector(".picker-host") as HTMLElement);
  shell.appendChild(header);

  // Sidebar, demos picker only. (Cross-surface nav now lives in the
  // header above, matching the landing.)
  const aside = document.createElement("aside");
  aside.innerHTML = `<div class="section-label">Demos</div>`;
  const nav = document.createElement("nav");
  for (const route of DEMO_ROUTES) {
    const a = document.createElement("a");
    a.href = route.href;
    a.textContent = route.label;
    if (route.id === opts.currentRoute) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
  }
  aside.appendChild(nav);
  shell.appendChild(aside);

  // Main slot, the demo fills this.
  const main = document.createElement("main");
  shell.appendChild(main);
  document.title = `${opts.title} · Fluid Demos`;
  document.body.appendChild(shell);
  return main;
}
