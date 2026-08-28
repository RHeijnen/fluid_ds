/**
 * Landing page for Fluid, mounted at the root of the unified website (`/`).
 *
 * The page is intentionally framework-free and component-heavy: it dogfoods
 * the library by building the marketing page out of `fluid-*` elements, and a
 * live theme switcher in the hero re-themes the WHOLE page by flipping
 * `data-fluid-brand` / `data-fluid-theme` on <html>. Charts, the comparison
 * viewer, inputs, every control below recolor together, which is the entire
 * pitch in one interaction.
 */
import "./register-fluid.js";

const GH = "https://github.com/RHeijnen/fluid_ds";

const LOGO = `
  <svg class="brand-mark" viewBox="0 0 96 96" aria-hidden="true">
    <defs>
      <linearGradient id="fluidLogoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3b82f6"></stop><stop offset="1" stop-color="#22d3ee"></stop>
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
  </svg>`;

const features = [
  [
    "blocks",
    "103 component families, no framework",
    "Standard custom elements. Use the tags directly in React, Vue, Angular, Svelte, Solid, or a plain HTML file; framework-specific setup is documented."
  ],
  [
    "palette",
    "Theme with one variable",
    "A small palette of semantic tokens drives everything. Override one value, retheme the whole app. Down to a single element if you want."
  ],
  [
    "circle-check",
    "Accessible by default",
    "Catalog-wide axe and server-rendering inventories cover every published element. Three-engine keyboard, focus, environment, and recovery contracts add depth without replacing manual review."
  ],
  [
    "sparkles",
    "Lean core, opt-in power",
    "The core stays small. Charts, data grids, calendars, a scheduler, a rich-text editor, kanban, maps, media, and more live in separate packages you add only when you need them."
  ]
];

const stats = [
  ["124", "core elements"],
  ["13", "expansion packs"],
  ["7", "packed consumers"],
  ["3", "browser engines"],
  ["AA", "WCAG 2.2 (AAA opt-in)"],
  ["1,500+", "icons available"]
];

const packs = [
  [
    "@fluid-ds/charts",
    "Chart.js-backed line, bar, doughnut, sparkline and more, themed by your tokens."
  ],
  [
    "@fluid-ds/scheduler",
    "Appointment scheduler: calendar with bookable time slots, plus an hours editor."
  ],
  [
    "@fluid-ds/table",
    "Accessible data grid: sortable, selectable, plus infinite scrolling, virtual rows, and column reorder/resize with a persistable layout."
  ],
  ["@fluid-ds/calendar", "Event calendar: a month view of events."],
  ["@fluid-ds/editor", "Lightweight accessible rich-text editor."],
  ["@fluid-ds/kanban", "Drag-and-drop board with a full keyboard path."],
  ["@fluid-ds/map", "Themed Leaflet map wrapper with markers."],
  [
    "@fluid-ds/node-graph",
    "Node graph editor: typed ports, Bezier edges, drag or keyboard connections."
  ],
  [
    "@fluid-ds/media",
    "Video player, playlists, animated images, zoomable frames, audio, lightbox."
  ],
  ["@fluid-ds/markdown", "Render Markdown to themed HTML with one element."],
  ["@fluid-ds/qr", "Themable QR codes as crisp SVG, including logo-embedded fancy codes."],
  [
    "@fluid-ds/parser",
    "Drag JSON, CSV or Excel onto a file-drop and parse it against a blueprint."
  ],
  [
    "@fluid-ds/animations",
    "Keyframe animations plus event effects like confetti, reduced-motion aware."
  ]
];

const surfaces = [
  ["Docs", "Guides, per-component pages, live examples, framework tabs.", "/docs/"],
  ["Storybook", "Every variant, state, and a11y check, interactively.", "/storybook/"],
  ["Theme builder", "Edit tokens live, isolate one element, export the CSS.", "/playground/"],
  ["Bundle builder", "Pick the components you need and generate a custom bundle.", "/wizard/"]
];

const frameworks = [
  ["Native HTML", "Buildless, via an import map.", "/demos/native/"],
  ["React", "React 19 + Vite.", "/demos/react/"],
  ["Next.js", "App Router, static host demo.", "/demos/next/"],
  ["Angular", "Angular 20 standalone.", "/demos/angular/"]
];

document.body.innerHTML = `
  <!-- ============================ NAV ============================ -->
  <header class="site-nav">
    <a class="brand" href="/">${LOGO}<span>Fluid</span></a>
    <nav class="primary" aria-label="Primary">
      <a href="/docs/">Docs</a>
      <a href="/storybook/">Storybook</a>
      <a href="/playground/">Theme builder</a>
      <a href="/wizard/">Bundle builder</a>
      <a href="/demos/">Demos</a>
      <a class="cta landing-button secondary compact" href="${GH}" target="_blank" rel="noopener" aria-label="GitHub repository">
        <fluid-icon name="github"></fluid-icon>
        GitHub
      </a>
    </nav>
  </header>

  <!-- ============================ HERO ============================ -->
  <section class="hero">
    <div class="hero-badges">
      <fluid-badge variant="info">pre-1.0</fluid-badge>
      <fluid-badge variant="success">AA contrast tokens · AAA mode</fluid-badge>
      <fluid-badge>npm: @fluid-ds/*@latest</fluid-badge>
      <fluid-badge>MIT licensed</fluid-badge>
    </div>
    <h1>Build it once.<br /><span class="accent">Drop it anywhere.</span></h1>
    <p class="lead">
      A framework-agnostic design system with <strong>124 core elements in 103 component families</strong>,
      themable down to a single CSS variable and tested across the published catalog.
      Works in every framework, and in the page that doesn't have one.
    </p>
    <div class="hero-actions">
      <a href="/docs/" class="landing-button">
        Get started <fluid-icon name="arrow-right"></fluid-icon>
      </a>
      <a href="/playground/" class="landing-button secondary">
        Open the theme builder
      </a>
      <fluid-button id="start-tour" variant="ghost"><fluid-icon slot="prefix" name="sparkles"></fluid-icon>Take the tour</fluid-button>
    </div>

    <!-- LIVE theme switcher: drives the whole page -->
    <div class="theme-switch" role="group" aria-label="Theme this page">
      <span class="theme-switch-label"><fluid-icon name="sparkles"></fluid-icon> Theme this entire page</span>
      <fluid-segmented-control id="brand-pick" value="default" aria-label="Brand">
        <fluid-segment value="default">Default</fluid-segment>
        <fluid-segment value="midnight">Midnight</fluid-segment>
        <fluid-segment value="corporate">Corporate</fluid-segment>
        <fluid-segment value="neon">Neon</fluid-segment>
      </fluid-segmented-control>
      <fluid-switch id="dark-toggle">Dark</fluid-switch>
    </div>
    <p class="theme-switch-note">Everything below, charts included, recolors live. That is the whole theming model.</p>
  </section>

  <!-- ====================== COMPARISON ====================== -->
  <section class="row">
    <h2>Raw HTML vs Fluid</h2>
    <p class="subhead">Same form, same DOM. Drag the divider: browser defaults on one side, Fluid components on the other.</p>
    <fluid-comparison style="border-radius:0.75rem; overflow:hidden; border:1px solid var(--fluid-border-default);">
      <div slot="before" class="compare-pane before">
        <span class="pane-label">Before</span>
        <div class="label-rough">Sign in to your account</div>
        <div><label for="cmp-email-raw">Email address</label>
          <input id="cmp-email-raw" type="email" placeholder="you@example.com" style="width:100%; padding:4px 6px;" /></div>
        <div><label for="cmp-pass-raw">Password</label>
          <input id="cmp-pass-raw" type="password" placeholder="••••••••" style="width:100%; padding:4px 6px;" /></div>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          <input id="cmp-remember-raw" type="checkbox" /><label for="cmp-remember-raw">Remember me</label></div>
        <button type="button" style="margin-top:0.25rem; padding:4px 10px;">Sign in</button>
      </div>
      <div slot="after" class="compare-pane after">
        <span class="pane-label">After</span>
        <strong style="font-size:1.05rem;">Sign in to your account</strong>
        <fluid-input label="Email address" type="email" placeholder="you@example.com"></fluid-input>
        <fluid-input label="Password" type="password" placeholder="••••••••"></fluid-input>
        <fluid-switch style="font-size:0.9rem;">Remember me</fluid-switch>
        <fluid-button style="margin-top:0.25rem;">Sign in</fluid-button>
        <div class="compare-tag-row" style="margin-top:auto;">
          <fluid-tag size="sm">accessible</fluid-tag>
          <fluid-tag size="sm" variant="primary">themable</fluid-tag>
        </div>
      </div>
    </fluid-comparison>
  </section>

  <!-- ====================== STATS ====================== -->
  <section class="row">
    <div class="stat-band">
      ${stats.map(([n, l]) => `<div class="stat"><span class="stat-num">${n}</span><span class="stat-label">${l}</span></div>`).join("")}
    </div>
  </section>

  <!-- ====================== FEATURES ====================== -->
  <section class="row">
    <h2>Drop in, look right, ship</h2>
    <p class="subhead">Four properties that set Fluid apart from the component library you considered last quarter.</p>
    <div class="feature-grid">
      ${features
        .map(
          ([icon, title, body]) => `
        <fluid-card variant="outline">
          <div class="feature-head"><fluid-icon name="${icon}" style="--fluid-icon-size:1.5rem;"></fluid-icon><strong>${title}</strong></div>
          <p style="margin:0; color:var(--fluid-text-secondary);">${body}</p>
        </fluid-card>`
        )
        .join("")}
    </div>
  </section>

  <!-- ====================== COMPONENT WALL ====================== -->
  <section class="row">
    <h2>One design language, 124 core elements</h2>
    <p class="subhead">A taste of the library. Flip the switcher up top and watch every one of these retheme at once.</p>
    <fluid-card variant="outline">
      <div class="wall">
        <div class="wall-cell">
          <fluid-button>Primary</fluid-button>
          <fluid-button variant="secondary">Secondary</fluid-button>
          <fluid-button variant="ghost">Ghost</fluid-button>
        </div>
        <div class="wall-cell">
          <fluid-badge>Default</fluid-badge>
          <fluid-badge variant="success">Success</fluid-badge>
          <fluid-badge variant="danger">Danger</fluid-badge>
          <fluid-badge variant="info">Info</fluid-badge>
        </div>
        <div class="wall-cell"><fluid-input placeholder="Email" aria-label="Email" style="width:100%;"></fluid-input></div>
        <div class="wall-cell"><fluid-select placeholder="Pick one" aria-label="Pick" style="width:100%;">
          <fluid-option value="a">Apple</fluid-option><fluid-option value="b">Banana</fluid-option></fluid-select></div>
        <div class="wall-cell"><fluid-slider value="60" aria-label="Slider" style="width:100%;"></fluid-slider></div>
        <div class="wall-cell"><fluid-switch checked>Notifications</fluid-switch></div>
        <div class="wall-cell"><fluid-rating value="4" aria-label="Rating"></fluid-rating></div>
        <div class="wall-cell">
          <fluid-segmented-control value="week" aria-label="Range">
            <fluid-segment value="day">Day</fluid-segment><fluid-segment value="week">Week</fluid-segment><fluid-segment value="month">Month</fluid-segment>
          </fluid-segmented-control>
        </div>
        <div class="wall-cell"><fluid-progress-bar value="68" aria-label="Progress" style="width:100%;"></fluid-progress-bar></div>
        <div class="wall-cell">
          <fluid-tooltip content="Themed tooltip"><fluid-button variant="secondary" size="sm">Hover me</fluid-button></fluid-tooltip>
          <fluid-avatar label="Ada Lovelace" size="sm"></fluid-avatar>
          <fluid-tag>tag</fluid-tag>
        </div>
        <div class="wall-cell wall-wide">
          <fluid-steps>
            <fluid-step complete>Plan</fluid-step>
            <fluid-step active>Build</fluid-step>
            <fluid-step>Ship</fluid-step>
          </fluid-steps>
        </div>
      </div>
    </fluid-card>
    <p style="text-align:center; margin-top:1rem;">
      <a href="/storybook/" class="landing-button secondary">Explore the catalog in Storybook <fluid-icon name="arrow-right"></fluid-icon></a>
    </p>
  </section>

  <!-- ====================== CHARTS ====================== -->
  <section class="row">
    <h2>Dashboards, themed in one variable</h2>
    <p class="subhead">The <code>@fluid-ds/charts</code> pack reads the same tokens, so your data viz matches your brand for free. (Try the switcher.)</p>
    <div class="chart-grid">
      <fluid-card variant="outline"><h3 slot="header" class="card-h">⭐ Stars collected over time</h3>
        <fluid-line-chart id="lc" style="--fluid-chart-height:260px;"></fluid-line-chart></fluid-card>
      <fluid-card variant="outline"><h3 slot="header" class="card-h">🎁 Loot table</h3>
        <fluid-doughnut-chart id="dc" style="--fluid-chart-height:260px;"></fluid-doughnut-chart></fluid-card>
    </div>
  </section>

  <!-- ====================== THEMING CALLOUT ====================== -->
  <section class="row">
    <fluid-callout variant="info">
      <span slot="header">Theming is the whole point</span>
      Change a brand variable and everything reflows: scope it to one component, one element, or the
      whole app. Light and dark are a single attribute, and you can go as far as the full neon
      takeover above. The <a href="/docs/theming/basics/">theming guide</a> has the full model, and the
      <a href="/playground/">theme builder</a> lets you design one right in the browser.
    </fluid-callout>
  </section>

  <!-- ====================== WHAT'S NEW (v0.3) ====================== -->
  <section class="row" id="whatsnew">
    <h2>New in <span class="accent">v0.3</span></h2>
    <p class="subhead">Fresh off the workbench: ink-true signature capture, a folding divider, managed table columns, built-in field labels, and a multi-pick typeahead.</p>
    <div class="whatsnew-grid">
      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">&lt;fluid-signature-pad&gt;</code>
        <p class="wn-blurb">Signatures captured as ink, not pixels: lossless redraw, per-stroke undo, pressure-aware lines, crisp export. Go on, scribble.</p>
        <div class="wn-stage">
          <fluid-signature-pad id="wn-signature" aria-label="Try the signature pad" style="width:100%;"></fluid-signature-pad>
        </div>
      </fluid-card>

      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">&lt;fluid-typeahead keep-open&gt;</code>
        <p class="wn-blurb">One attribute turns the typeahead into a multi-picker: the list stays open after a choice and every pick lands below.</p>
        <div class="wn-stage">
          <div class="wn-stack">
            <fluid-typeahead id="wn-pick" keep-open aria-label="Add toppings" placeholder="Add toppings…"
              options='["Basil","Mozzarella","Mushroom","Olive","Pepperoni","Ricotta"]'></fluid-typeahead>
            <div class="wn-picks" id="wn-picks" aria-live="polite"></div>
          </div>
        </div>
      </fluid-card>

      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">label + help-text</code>
        <p class="wn-blurb">Inputs, selects, textareas, typeaheads, and the time and date pickers grow a real label and help row from two attributes. No wrapper needed.</p>
        <div class="wn-stage">
          <fluid-input label="Workspace name" help-text="Visible to everyone on your team." placeholder="acme-inc" style="width:100%; max-width:16rem;"></fluid-input>
        </div>
      </fluid-card>

      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">&lt;fluid-fold&gt;</code>
        <p class="wn-blurb">A divider with a disclosure at its centre: tuck away the long tail of a page without accordion chrome.</p>
        <div class="wn-stage">
          <div class="wn-stack">
            <p class="wn-fold-copy">Fluid ships 124 core elements across 103 families. The headliners fit right here&hellip;</p>
            <fluid-fold label="Show the rest">
              <p class="wn-fold-copy">&hellip;and the long tail unfolds on demand: signature pads, speed dials, tours, transfer lists, OTP inputs, and about 90 more.</p>
            </fluid-fold>
          </div>
        </div>
      </fluid-card>

      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">@fluid-ds/table</code>
        <p class="wn-blurb">Infinite-table columns are now fully manageable: drag or keyboard reorder, resize with double-click auto-fit, an opt-in column scrollbar. One persistable layout.</p>
        <div class="wn-stage">
          <div class="wn-parser">
            <div class="wn-columns" aria-hidden="true">
              <div class="wn-col" style="flex:1.4;"><span>Terminal</span><i></i></div>
              <div class="wn-col"><span>Status</span><i></i></div>
              <div class="wn-col"><span>Site</span><i></i></div>
            </div>
            <span class="wn-parser-note">reorder &middot; resize &middot; auto-fit &middot; column-scroll</span>
          </div>
        </div>
      </fluid-card>
    </div>
  </section>

  <!-- ====================== EXPANSION PACKS ====================== -->
  <section class="row">
    <h2>Lean core, opt-in power</h2>
    <p class="subhead">Thirteen expansion packs keep the base bundle small. Add only what you reach for.</p>
    <div class="feature-grid">
      ${packs
        .map(
          ([name, body]) => `
        <fluid-card variant="outline">
          <code class="pack-name">${name}</code>
          <p style="margin:0.5rem 0 0; color:var(--fluid-text-secondary); font-size:0.95rem;">${body}</p>
        </fluid-card>`
        )
        .join("")}
    </div>
  </section>

  <!-- ====================== SURFACES / TOOLING ====================== -->
  <section class="row">
    <h2>Four ways to work with it</h2>
    <p class="subhead">Documented, explorable, designable, and configurable, all from the same components.</p>
    <div class="feature-grid">
      ${surfaces
        .map(
          ([title, body, href]) => `
        <a href="${href}" class="surface-card">
          <fluid-card variant="outline">
            <strong>${title} <fluid-icon name="arrow-right" style="--fluid-icon-size:0.9rem;"></fluid-icon></strong>
            <p style="margin:0.4rem 0 0; color:var(--fluid-text-secondary); font-size:0.95rem;">${body}</p>
          </fluid-card>
        </a>`
        )
        .join("")}
    </div>
  </section>

  <!-- ====================== FRAMEWORKS ====================== -->
  <section class="row">
    <h2>Don't take "agnostic" on faith</h2>
    <p class="subhead">Compare the same admin portal in plain HTML, React, Next.js, and Angular. The repository maintains representative packed Vue, Astro, and SvelteKit consumers; see the docs for exact CSR, static DSD, reproducible replay, and the bounded local Next request-time contract.</p>
    <div class="feature-grid">
      ${frameworks
        .map(
          ([title, body, href]) => `
        <a href="${href}" class="surface-card">
          <fluid-card variant="outline">
            <strong>${title} <fluid-icon name="arrow-right" style="--fluid-icon-size:0.9rem;"></fluid-icon></strong>
            <p style="margin:0.4rem 0 0; color:var(--fluid-text-secondary); font-size:0.95rem;">${body}</p>
          </fluid-card>
        </a>`
        )
        .join("")}
    </div>
  </section>

  <!-- ====================== SETUP ====================== -->
  <section class="row">
    <h2>Five-line setup</h2>
    <p class="subhead">Paste into any HTML page. No bundler, no framework, no build step.</p>
    <fluid-code-block language="html" code='<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/base.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/light.css" />

<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/icons@latest/dist/register-defaults.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/components@latest/dist/components/button/define.js"></script>

<fluid-button>Hello, Fluid</fluid-button>'></fluid-code-block>
    <p class="subhead" style="margin-top:1rem;">Prefer npm? <code>npm i @fluid-ds/components@latest</code>. Full <a href="/docs/getting-started/installation/">installation guide</a>.</p>
  </section>

  <!-- ====================== OPEN SOURCE CTA ====================== -->
  <section class="row cta-row">
    <fluid-card variant="outline">
      <div class="cta-inner">
        <h2 style="margin:0;">Open source, on the platform you trust</h2>
        <p class="subhead" style="margin:0.5rem auto 1.5rem;">MIT licensed, built on standard web APIs, and developed in the open. Stars, issues, and PRs welcome.</p>
        <div class="hero-actions">
          <a href="${GH}" target="_blank" rel="noopener" class="landing-button">
            <fluid-icon name="github"></fluid-icon>View on GitHub</a>
          <a href="https://www.npmjs.com/package/@fluid-ds/components" target="_blank" rel="noopener" class="landing-button secondary">
            View on npm</a>
          <a href="/docs/" class="landing-button ghost">Read the docs</a>
        </div>
      </div>
    </fluid-card>
  </section>

  <!-- Guided tour overlay (steps set + opened from JS). -->
  <fluid-tour id="page-tour"></fluid-tour>

  <!-- ============================ FOOTER ============================ -->
  <footer class="site-footer">
    <div class="footer-links">
      <a href="/docs/">Docs</a><a href="/storybook/">Storybook</a><a href="/playground/">Theme builder</a>
      <a href="/wizard/">Bundle builder</a><a href="/demos/">Demos</a>
      <a href="${GH}" target="_blank" rel="noopener">GitHub</a>
      <a href="https://www.npmjs.com/package/@fluid-ds/components" target="_blank" rel="noopener">npm</a>
    </div>
    <p>Fluid is open source and MIT-licensed. Built by
      <a href="https://rheijnen.github.io" target="_blank" rel="noopener">René Heijnen</a>.</p>
  </footer>
`;

/* ---------------------------------------------------------------- */
/* Live theme switcher: flip data-fluid-brand / data-fluid-theme on  */
/* <html> and the whole page (charts included) re-themes.            */
/* ---------------------------------------------------------------- */
const html = document.documentElement;
const brandPick = document.getElementById("brand-pick");
brandPick?.addEventListener("fluid-change", (e) => {
  const value = (e as CustomEvent).detail?.value ?? "default";
  if (value === "default") html.removeAttribute("data-fluid-brand");
  else html.setAttribute("data-fluid-brand", value);
});
const darkToggle = document.getElementById("dark-toggle");
darkToggle?.addEventListener("fluid-change", (e) => {
  const on = (e as CustomEvent).detail?.checked ?? false;
  html.setAttribute("data-fluid-theme", on ? "dark" : "light");
});

/* ---------------------------------------------------------------- */
/* Chart data. The chart components read Fluid tokens themselves and  */
/* re-theme on attribute changes, so we only feed them data here.     */
/* ---------------------------------------------------------------- */
const lc = document.getElementById("lc") as (HTMLElement & { data?: unknown }) | null;
if (lc) {
  lc.data = {
    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"],
    datasets: [{ label: "Stars", data: [3, 9, 14, 22, 31, 44], tension: 0.4, fill: true }]
  };
}
const dc = document.getElementById("dc") as (HTMLElement & { data?: unknown }) | null;
if (dc) {
  dc.data = {
    labels: ["Common", "Rare", "Epic", "Legendary"],
    datasets: [{ data: [58, 27, 12, 3] }]
  };
}

/* ---------------------------------------------------------------- */
/* New in v0.4: the keep-open typeahead demo collects each pick as a */
/* tag under the field, so the multi-pick behavior is visible.       */
/* ---------------------------------------------------------------- */
const wnPick = document.getElementById("wn-pick");
const wnPicks = document.getElementById("wn-picks");
wnPick?.addEventListener("fluid-change", (e) => {
  const option = (e as CustomEvent).detail?.option as
    | { value?: unknown; label?: string }
    | undefined;
  if (!option || !wnPicks) return;
  const label = option.label ?? String(option.value ?? "");
  // One tag per distinct pick; re-picking the same value is a no-op.
  if (Array.from(wnPicks.children).some((c) => c.textContent === label)) return;
  const tag = document.createElement("fluid-tag");
  tag.setAttribute("size", "sm");
  tag.textContent = label;
  wnPicks.appendChild(tag);
});

/* ---------------------------------------------------------------- */
/* Guided product tour: walk the hero theme switcher, the new-in-0.3 */
/* showcase, the dashboards, and the packs. Targets are light-DOM    */
/* ids, so the tour resolves them via its document fallback.         */
/* ---------------------------------------------------------------- */
const tour = document.getElementById("page-tour") as
  | (HTMLElement & { steps?: unknown; show?: () => void })
  | null;
if (tour) {
  tour.steps = [
    {
      target: ".theme-switch",
      title: "Theme the whole page",
      body: "Pick a brand or flip dark mode. Every component below, charts included, recolours live from the same tokens.",
      placement: "bottom"
    },
    {
      target: "#whatsnew",
      title: "New in v0.4",
      body: "Ink-true signature capture, a folding divider, managed table columns, built-in field labels, and a multi-pick typeahead.",
      placement: "top"
    },
    {
      target: "#wn-signature",
      title: "Sign on the line",
      body: "The signature pad records strokes as ink: undo one stroke, resize losslessly, export crisp. Go on, scribble.",
      placement: "top"
    },
    {
      target: ".chart-grid",
      title: "Data viz, on-brand",
      body: "The charts pack reads the same tokens, so dashboards match your brand for free.",
      placement: "top"
    }
  ];
  document.getElementById("start-tour")?.addEventListener("click", () => tour.show?.());
}
