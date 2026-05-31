import "./shared/register-fluid.js";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";

const main = mountShell({ title: "Demos", currentRoute: "index" });
mountDesignOverlay();

interface Tile {
  href: string;
  icon: string;
  title: string;
  desc: string;
  tag?: string;
}

const samples: Tile[] = [
  { href: "./settings/", icon: "⚙️", title: "Settings dashboard", desc: "A SaaS settings page: profile, notifications, a billing chart, form fields, and a save / cancel footer." },
  { href: "./admin/", icon: "📊", title: "Admin / data", desc: "A data-table admin: filter bar, rows, a bulk-action dropdown, a confirm-delete dialog, and status badges." }
];

const portals: Tile[] = [
  { href: "./native/", icon: "🌐", title: "Native HTML", tag: "no build", desc: "Zero build step. Loaded from the CDN with an import map over plain ES modules and hash routing." },
  { href: "./react/", icon: "⚛️", title: "React", tag: "React 19", desc: "Props via refs, custom events via native handlers, charts wrapped as components." },
  { href: "./next/", icon: "▲", title: "Next.js", tag: "App Router", desc: "SSR-safe: the server emits HTML, the client registers the elements. Statically exported." },
  { href: "./angular/", icon: "🅰️", title: "Angular", tag: "v20", desc: "Standalone, CUSTOM_ELEMENTS_SCHEMA, and [prop] / (event) bindings to the custom elements." }
];

const tile = (t: Tile) => `
  <a class="demo-tile" href="${t.href}">
    <span class="demo-tile-icon" aria-hidden="true">${t.icon}</span>
    <span class="demo-tile-body">
      <span class="demo-tile-title">${t.title}${t.tag ? `<fluid-badge size="sm" variant="info">${t.tag}</fluid-badge>` : ""}</span>
      <span class="demo-tile-desc">${t.desc}</span>
    </span>
    <span class="demo-tile-go" aria-hidden="true">Open <fluid-icon name="arrow-right"></fluid-icon></span>
  </a>`;

main.innerHTML = `
  <section class="demo-index">
    <header class="demo-hero">
      <fluid-badge variant="info">Live demos</fluid-badge>
      <h1>Fluid in real apps</h1>
      <p class="demo-lead">
        End-to-end apps built entirely from Fluid components. Open one, then flip the brand in the
        top-right header and watch every control, chart, and surface re-theme together.
      </p>
    </header>

    <h2 class="demo-section-title">Sample apps</h2>
    <div class="demo-grid">${samples.map(tile).join("")}</div>

    <h2 class="demo-section-title">The same portal, four frameworks</h2>
    <p class="demo-section-sub">
      One admin portal, four builds, the identical components in each. Proof that "framework-agnostic"
      is real, not a tagline.
    </p>
    <div class="demo-grid">${portals.map(tile).join("")}</div>

    <p class="demo-foot">
      Looking for the marketing page? That's the <a href="../">site root</a>.
    </p>
  </section>
`;
