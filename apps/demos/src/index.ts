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
  {
    href: "./settings/",
    icon: "⚙️",
    title: "Settings dashboard",
    desc: "A SaaS settings page: profile, notifications, a billing chart, form fields, and a save / cancel footer."
  },
  {
    href: "./admin/",
    icon: "📊",
    title: "Admin / data",
    desc: "A data-table admin: filter bar, rows, a bulk-action dropdown, a confirm-delete dialog, and status badges."
  },
  {
    href: "./data-table/",
    icon: "🗂️",
    title: "Data table",
    desc: "The infinite table on a real dataset: windowed rows, infinite loading, sorting, filters, and a persistent column layout."
  },
  {
    href: "./analytics/",
    icon: "📈",
    title: "Analytics",
    desc: "A chart-heavy overview: bar, radar, polar area, and sparklines, all reading the same brand tokens."
  },
  {
    href: "./booking/",
    icon: "📅",
    title: "Booking",
    desc: "The appointment scheduler on a clinic's real opening hours: pick a day, pick a free slot, confirm."
  },
  {
    href: "./board/",
    icon: "🗃️",
    title: "Sprint board",
    desc: "The kanban board mid-sprint: drag cards between columns, or move them entirely by keyboard."
  },
  {
    href: "./qr/",
    icon: "🔳",
    title: "QR studio",
    desc: "Design a themable QR code live: shapes, eyes, colors, and a center logo, exported as crisp SVG."
  }
];

/*
 * The four framework portals are SEPARATE apps. The unified website build
 * mounts them under /demos/{native,react,next,angular}/, so the relative
 * links work there; in standalone dev those paths do not exist, so each tile
 * points at the portal's own dev server instead (start it with
 * `corepack pnpm --filter @fluid-ds/admin-<name> dev`).
 */
const DEV = import.meta.env.DEV;
const portalHref = (route: string, devPort: number): string =>
  DEV ? `http://localhost:${devPort}/` : `./${route}/`;

const portals: Tile[] = [
  {
    href: portalHref("native", 4318),
    icon: "🌐",
    title: "Native HTML",
    tag: "no build",
    desc: "Zero build step. Loaded from the CDN with an import map over plain ES modules and hash routing."
  },
  {
    href: portalHref("react", 5191),
    icon: "⚛️",
    title: "React",
    tag: "React 19",
    desc: "Props via refs, custom events via native handlers, charts wrapped as components."
  },
  {
    href: portalHref("next", 5291),
    icon: "▲",
    title: "Next.js",
    tag: "App Router",
    desc: "SSR-safe: the server emits HTML, the client registers the elements. Statically exported."
  },
  {
    href: portalHref("angular", 5391),
    icon: "🅰️",
    title: "Angular",
    tag: "v20",
    desc: "Standalone components plus @fluid-ds/angular: reactive forms bind straight to the custom elements."
  }
];

const tile = (t: Tile) => `
  <a class="demo-tile fluid-glass-panel" href="${t.href}">
    <span class="demo-tile-icon" aria-hidden="true">${t.icon}</span>
    <span class="demo-tile-body">
      <span class="demo-tile-title">${t.title}${t.tag ? `<fluid-badge size="sm" variant="info">${t.tag}</fluid-badge>` : ""}</span>
      <span class="demo-tile-desc">${t.desc}</span>
    </span>
    <span class="demo-tile-go" aria-hidden="true">Open <fluid-icon name="arrow-right"></fluid-icon></span>
  </a>`;

main.innerHTML = `
  <section class="demo-index fluid-glass-panel">
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
      is real, not a tagline.${
        DEV
          ? ` <em>Standalone dev: each portal is its own app on its own port; start one with
      <code>corepack pnpm --filter @fluid-ds/admin-&lt;name&gt; dev</code>.</em>`
          : ""
      }
    </p>
    <div class="demo-grid">${portals.map(tile).join("")}</div>

    <p class="demo-foot">
      Looking for the marketing page? That's the <a href="../">site root</a>.
    </p>
  </section>
`;
