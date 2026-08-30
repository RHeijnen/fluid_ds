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
/* Installable brand presets from @fluid-ds/themes, used by the demo portal's
   theme switcher. Each is a self-contained CSS file applied via
   data-fluid-brand, so what the demo shows is exactly what a consumer installs. */
import "@fluid-ds/themes/titanium.css";
import "@fluid-ds/themes/glass.css";
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";
import "@fluid-ds/themes/orchid.css";
/* The standalone animation system: boot the attribute controller + its default
   keyframes, and pull in the imperative effects for the motion demo. Nothing
   here depends on any fluid-* component; it drives plain elements too. */
import "@fluid-ds/animations/define/controller";
import "@fluid-ds/animations/register-defaults";
import { playElementAnimation } from "@fluid-ds/animations";
import {
  confetti,
  fireworks,
  sparkles,
  pride,
  hearts,
  stars,
  snow,
  butterflies
} from "@fluid-ds/animations/effects";

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
    "Standard custom elements, no wrappers required. Drop the same tags into React, Vue, Angular, Svelte, Solid, or plain HTML. The proof ships with this site: one admin portal, built four times over in native HTML, React, Next.js, and Angular."
  ],
  [
    "palette",
    "Theme with one variable",
    "Semantic tokens drive every component. Retheme the whole app from one variable, one component, or one instance, in light or dark. Install a ready-made brand (Glass, Titanium, Midnight, Corporate, Orchid) or design your own in the visual Theme Builder."
  ],
  [
    "circle-check",
    "Accessible by default",
    "Built to WCAG 2.2 AA: WAI-ARIA semantics, keyboard support, focus management, 24px targets, 4.5:1 contrast. Fluid also follows the reader's own OS settings: reduced motion, dark mode, high contrast, and RTL are machine-verified across the catalog, and AA to AAA is one toggle. Certification is in progress; automated audits never replace manual review."
  ],
  [
    "sparkles",
    "Lean core, opt-in power",
    "The core stays lean. Charts, data grids, calendars, a scheduler, a rich-text editor, Markdown, kanban, maps, a node-graph editor, QR codes, a file parser, media players, and animations ship as separate packages you add only when you need them."
  ]
];

/**
 * Hero figures. Every number here is sourced from
 * `docs/verification-and-test-inventory-0.4.0.md`, which deliberately separates
 * unique assertions from repeated three-engine executions. Do not merge these
 * populations into one "tests" total, and do not restate them from memory:
 * re-read the inventory when a number changes.
 */
const heroStats = [
  ["155", "custom elements", "103 families across 14 packages"],
  ["2,719", "browser assertions", "per engine, 8,157 across three engines"],
  ["96.5%", "statement coverage", "measured on browser-loaded source"]
];

const stats = [
  ["124", "core elements"],
  ["13", "expansion packs"],
  ["6", "brand presets"],
  ["7", "packed consumers"],
  ["AA", "WCAG 2.2 (AAA opt-in)"],
  ["1,545", "icons available"]
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
    "Attribute-driven keyframes plus 31 canvas effects, confetti to butterflies, all reduced-motion aware."
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
      <div class="nav-theme" role="group" aria-label="Theme this page">
        <fluid-select id="site-brand" value="default" aria-label="Brand theme" class="anim-brand-picker">
          <fluid-option value="default">Default</fluid-option>
          <fluid-option value="glass">Glass</fluid-option>
          <fluid-option value="titanium">Titanium</fluid-option>
          <fluid-option value="midnight">Midnight</fluid-option>
          <fluid-option value="corporate">Corporate</fluid-option>
          <fluid-option value="orchid">Orchid</fluid-option>
        </fluid-select>
        <fluid-button id="site-dark" variant="ghost" size="sm" aria-label="Toggle dark mode">
          <fluid-icon name="sun-moon"></fluid-icon>
        </fluid-button>
      </div>
      <a class="cta landing-button secondary compact" href="${GH}" target="_blank" rel="noopener" aria-label="GitHub repository">
        <fluid-icon name="github"></fluid-icon>
        GitHub
      </a>
    </nav>
  </header>

  <!-- ============================ HERO ============================ -->
  <section class="hero">
    <!-- Left column: who we are, and the numbers behind it. -->
    <div class="hero-copy">
      <div class="hero-badges">
        <fluid-badge variant="info">153 stable components</fluid-badge>
        <fluid-badge variant="success">WCAG 2.2 AA · AAA opt-in</fluid-badge>
        <fluid-badge>Free forever · MIT</fluid-badge>
      </div>

      <h1 class="hero-title">
        <span class="hero-name-row">
          ${LOGO.replace('class="brand-mark"', 'class="hero-mark"')}
          <span class="hero-name accent">Fluid</span>
        </span>
        <span class="hero-tagline">Build it once. Drop it anywhere.</span>
      </h1>

      <p class="lead">
        A framework-agnostic design system of standard custom elements, themable
        down to a single CSS variable. Works in every framework, and in the page
        that doesn't have one.
      </p>

      <dl class="hero-stats">
        ${heroStats
          .map(
            ([value, label, note]) => `
          <div class="hero-stat">
            <dt class="hero-stat-label">${label}</dt>
            <dd class="hero-stat-value">${value}</dd>
            <dd class="hero-stat-note">${note}</dd>
          </div>`
          )
          .join("")}
      </dl>

      <div class="hero-actions">
        <a href="/docs/" class="landing-button">
          Get started <fluid-icon name="arrow-right"></fluid-icon>
        </a>
        <a href="/playground/" class="landing-button secondary">
          Open the theme builder
        </a>
        <fluid-button id="start-tour" variant="ghost"><fluid-icon slot="prefix" name="sparkles"></fluid-icon>Take the tour</fluid-button>
      </div>

      <div class="hero-install">
        <code>pnpm add @fluid-ds/components @fluid-ds/tokens</code>
        <fluid-copy-button
          value="pnpm add @fluid-ds/components @fluid-ds/tokens"
          aria-label="Copy install command"
        ></fluid-copy-button>
      </div>
    </div>

    <!-- Right column: a scattered collage of real Fluid components, each one
         hand-placed on a fixed-size stage. Nothing is wrapped in a card it
         did not bring itself. Below the two-column breakpoint the stage stops
         positioning and the pieces fall into a plain wrapped row, so nothing
         collides on narrow screens. -->
    <div class="hero-showcase">
      <!-- Two flow columns on the stage. The theme cycler animates paddings
           and fonts, so pieces change height; flow layout lets each column
           reflow smoothly instead of colliding the way absolute pins did. The
           scattered look comes from column offsets and per-item jitter. -->
      <div class="hero-stage" aria-label="A sample of Fluid components, restyled live">
        <!-- The stage is a framed canvas: a caption plus two live pieces, all
             re-themed by the token cycler in the script below. The caption is
             decorative marketing, so it is hidden on narrow screens. -->
        <span class="hero-stage-tag" aria-hidden="true">
          <fluid-icon name="sparkles"></fluid-icon>
          Style it however you want
        </span>
        <fluid-card class="pin pin-profile">
          <div class="profile-head">
            <fluid-avatar initials="SC" label="Sarah Chen" size="lg"></fluid-avatar>
            <div>
              <span class="profile-eyebrow">Employee ID</span>
              <strong class="profile-name">Sarah Chen</strong>
            </div>
          </div>
          <fluid-description-list>
            <fluid-description-item>
              <span slot="term">Dept</span>
              Engineering
            </fluid-description-item>
            <fluid-description-item>
              <span slot="term">ID</span>
              EMP-2847
            </fluid-description-item>
          </fluid-description-list>
          <div class="profile-actions">
            <fluid-button size="sm">Message</fluid-button>
            <fluid-button size="sm" variant="secondary">Profile</fluid-button>
          </div>
        </fluid-card>

        <div class="pin pin-search">
          <fluid-input placeholder="Search..." aria-label="Search">
            <fluid-icon slot="prefix" name="search"></fluid-icon>
          </fluid-input>
          <fluid-button size="sm" variant="secondary">Go</fluid-button>
        </div>
      </div>

    </div>
  </section>

  <!-- ====================== DEMO PORTAL ====================== -->
  <!-- PrimeNG-style "website inside the website": a framed demo application
       assembled entirely from live Fluid components. Nothing in here is a
       screenshot; it is the same catalog the rest of the page uses. -->
  <section class="row portal-section" id="portal-demo">
    <h2>An app, assembled from the catalog</h2>
    <p class="subhead">
      Everything inside this window is a live Fluid component: navigation, stats
      and charts. Same tags, same tokens.
    </p>
    <div class="portal-theme-switch" role="group" aria-label="Preview theme">
      <span class="portal-theme-label">
        <fluid-icon name="sparkles"></fluid-icon>
        Theme
      </span>
      <fluid-segmented-control id="portal-theme" value="default" aria-label="Demo portal theme">
        <fluid-segment value="default">Default</fluid-segment>
        <fluid-segment value="glass">Glass</fluid-segment>
        <fluid-segment value="titanium">Titanium</fluid-segment>
        <fluid-segment value="corporate">Corporate</fluid-segment>
      </fluid-segmented-control>
      <span class="portal-theme-hint">Ships as <code>@fluid-ds/themes</code></span>
      <div class="portal-appearance" role="group" aria-label="Preview appearance">
        <span class="portal-theme-label">
          <fluid-icon name="sun-moon"></fluid-icon>
          Appearance
        </span>
        <fluid-segmented-control
          id="portal-appearance"
          value="light"
          aria-label="Demo portal appearance"
        >
          <fluid-segment value="light">Light</fluid-segment>
          <fluid-segment value="dark">Dark</fluid-segment>
        </fluid-segmented-control>
      </div>
      <label class="portal-measure">
        <fluid-switch id="portal-annotations" checked aria-label="Show token measurements"></fluid-switch>
        <span class="portal-theme-label">Measurements</span>
      </label>
    </div>
    <div class="portal-stage">
    <div class="portal-frame" data-fluid-theme="light">
      <span
        class="portal-annotation-probe"
        id="portal-annotation-probe"
        aria-hidden="true"
        style="color: var(--fluid-accent-base); font-size: var(--fluid-font-size-md)"
      ></span>
      <div class="portal-chrome fluid-glass-panel" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <!-- The portal's top bar is a real fluid-app-bar: brand in the start
           slot, a PrimeNG-style menubar (links + dropdown submenus) in the
           default nav region, and search/actions in the end slot. -->
      <fluid-app-bar class="portal-bar">
        <span slot="start" class="portal-brand">${LOGO.replace('class="brand-mark"', 'class="portal-mark"')}<strong>Fluid Cloud</strong></span>

        <nav class="portal-menubar" aria-label="Demo portal sections">
          <a href="#portal-demo" aria-current="page">Overview</a>
          <fluid-dropdown>
            <fluid-button slot="trigger" variant="ghost">
              Products
              <fluid-icon slot="suffix" name="chevron-down"></fluid-icon>
            </fluid-button>
            <fluid-dropdown-item value="catalog">Catalog</fluid-dropdown-item>
            <fluid-dropdown-item value="inventory">Inventory</fluid-dropdown-item>
            <fluid-dropdown-item value="bundles">Bundles</fluid-dropdown-item>
          </fluid-dropdown>
          <fluid-dropdown>
            <fluid-button slot="trigger" variant="ghost">
              Reports
              <fluid-icon slot="suffix" name="chevron-down"></fluid-icon>
            </fluid-button>
            <fluid-dropdown-item value="weekly">Weekly digest</fluid-dropdown-item>
            <fluid-dropdown-item value="quarterly">Quarterly review</fluid-dropdown-item>
            <fluid-dropdown-item type="separator"></fluid-dropdown-item>
            <fluid-dropdown-item value="export">Export CSV</fluid-dropdown-item>
          </fluid-dropdown>
          <a href="#portal-demo">Pricing</a>
        </nav>

      </fluid-app-bar>

      <div class="portal">
        <!-- Compact icon-only rail. Every control is a real button with an
             accessible name plus a tooltip; the active destination is the
             filled one. -->
        <aside class="portal-side fluid-glass-panel">
          <nav class="portal-rail" aria-label="Demo portal">
            <fluid-tooltip content="Dashboard" placement="right">
              <fluid-button aria-label="Dashboard" aria-current="page"><fluid-icon name="house"></fluid-icon></fluid-button>
            </fluid-tooltip>
            <fluid-tooltip content="Customers" placement="right">
              <fluid-button variant="ghost" aria-label="Customers"><fluid-icon name="users"></fluid-icon></fluid-button>
            </fluid-tooltip>
            <fluid-tooltip content="Schedule" placement="right">
              <fluid-button variant="ghost" aria-label="Schedule"><fluid-icon name="calendar"></fluid-icon></fluid-button>
            </fluid-tooltip>
            <fluid-tooltip content="Favorites" placement="right">
              <fluid-button variant="ghost" aria-label="Favorites"><fluid-icon name="star"></fluid-icon></fluid-button>
            </fluid-tooltip>
          </nav>
          <div class="portal-rail-foot">
            <fluid-tooltip content="Settings" placement="right">
              <fluid-button variant="ghost" aria-label="Settings"><fluid-icon name="settings"></fluid-icon></fluid-button>
            </fluid-tooltip>
            <fluid-avatar initials="SC" size="sm" label="Sarah Chen"></fluid-avatar>
          </div>
        </aside>

        <div class="portal-main">
          <div class="portal-body">
            <div class="portal-head fluid-glass-panel">
              <div class="portal-head-copy">
                <span class="portal-eyebrow">Overview <fluid-badge variant="success">Live</fluid-badge></span>
                <h3 class="portal-title">Store command</h3>
                <p class="portal-sub">Orders, revenue and rollout across every region.</p>
              </div>
            </div>

            <div class="portal-controls">
              <fluid-segmented-control id="portal-range" value="monthly" aria-label="Reporting range">
                <fluid-segment value="weekly">Weekly</fluid-segment>
                <fluid-segment value="monthly">Monthly</fluid-segment>
                <fluid-segment value="yearly">Yearly</fluid-segment>
              </fluid-segmented-control>
              <span class="portal-controls-end">
                <fluid-button size="sm">
                  <fluid-icon slot="prefix" name="download"></fluid-icon>
                  Download
                </fluid-button>
              </span>
            </div>
            <!-- A compact mosaic: two KPIs and the revenue line share the left,
                 the traffic-sources card spans the full height on the right. -->
            <div class="portal-grid">
              <fluid-card class="kpi kpi-balance">
                <span class="kpi-top">Total balance <span class="kpi-chip fluid-glass-panel"><fluid-icon name="wallet"></fluid-icon></span></span>
                <span class="kpi-value">$1.42M</span>
                <span class="kpi-foot"><fluid-badge variant="success">+12.4%</fluid-badge></span>
              </fluid-card>
              <fluid-card class="kpi kpi-netflow">
                <span class="kpi-top">Net flow <span class="kpi-chip fluid-glass-panel"><fluid-icon name="arrow-right-left"></fluid-icon></span></span>
                <span class="kpi-value">$284.6K</span>
                <span class="kpi-foot"><fluid-badge variant="success">+8.2%</fluid-badge></span>
              </fluid-card>
              <fluid-card class="portal-chart-card">
                <h3 class="card-h">Revenue</h3>
                <fluid-line-chart id="portal-line" style="--fluid-chart-height:190px;"></fluid-line-chart>
              </fluid-card>
              <fluid-card class="portal-donut-card">
                <h3 class="card-h">Traffic sources</h3>
                <fluid-doughnut-chart id="portal-donut" style="--fluid-chart-height:170px;"></fluid-doughnut-chart>
                <!-- Same brand-ramp tokens the chart paints its slices with,
                     so this list recolors with the donut on a brand switch. -->
                <ul class="portal-mix">
                  <li><span class="mix-dot" style="background:var(--fluid-color-brand-600);"></span>Direct<span class="mix-val">42%</span></li>
                  <li><span class="mix-dot" style="background:var(--fluid-color-brand-500);"></span>Search<span class="mix-val">31%</span></li>
                  <li><span class="mix-dot" style="background:var(--fluid-color-brand-400);"></span>Referral<span class="mix-val">17%</span></li>
                  <li><span class="mix-dot" style="background:var(--fluid-color-brand-300);"></span>Social<span class="mix-val">10%</span></li>
                </ul>
                <!-- Footer pinned to the card's bottom so the tall traffic card
                     reads as full rather than half-empty. Demo chrome. -->
                <div class="portal-traffic-foot">
                  <span class="portal-traffic-note">Live &middot; refreshed just now</span>
                  <fluid-button size="sm" variant="ghost">
                    Full report
                    <fluid-icon slot="suffix" name="arrow-right"></fluid-icon>
                  </fluid-button>
                </div>
              </fluid-card>
            </div>
          </div>
        </div>
      </div>
    </div>
      <div class="portal-annotations" aria-hidden="true">
        <svg id="portal-measure-svg" class="portal-measure-svg"></svg>
        <div id="portal-measure-labels" class="portal-measure-labels"></div>
      </div>
    </div>
  </section>

  <!-- ====================== MOTION / ANIMATIONS ====================== -->
  <section class="motion-band" id="motion">
    <div class="motion-band-inner">
      <span class="motion-eyebrow">✨ @fluid-ds/animations</span>
      <h2>Motion, as a standalone package</h2>
      <p class="subhead">Two halves in one dependency-free package: a controller that runs keyframes from a <code>data-fluid-animation</code> attribute, and a canvas effects engine with 31 effects, from confetti to butterflies. It works with or without the rest of Fluid, in any framework or none, and every effect stands down when the reader prefers reduced motion.</p>
      <div class="motion-grid">
        <fluid-card variant="outline">
          <h3 slot="header" class="card-h">✨ Effects engine</h3>
          <p class="motion-copy">One import, one call. Each effect ships a tuned palette; tinting to your brand colors is opt-in. Click one:</p>
          <div class="motion-buttons">
            <fluid-button data-effect="confetti">🎉 Confetti</fluid-button>
            <fluid-button data-effect="butterflies" variant="secondary">🦋 Butterflies</fluid-button>
            <fluid-button data-effect="fireworks" variant="secondary">🎆 Fireworks</fluid-button>
            <fluid-button data-effect="sparkles" variant="secondary">✨ Sparkles</fluid-button>
            <fluid-button data-effect="pride" variant="secondary">🌈 Pride</fluid-button>
            <fluid-button data-effect="hearts" variant="secondary">💖 Hearts</fluid-button>
            <fluid-button data-effect="stars" variant="secondary">⭐ Stars</fluid-button>
            <fluid-button data-effect="snow" variant="ghost">❄️ Snow</fluid-button>
          </div>
          <pre class="motion-code"><code>import { confetti } from "@fluid-ds/animations/effects";
confetti();</code></pre>
        </fluid-card>
        <fluid-card variant="outline">
          <h3 slot="header" class="card-h">🎬 Attribute-driven</h3>
          <p class="motion-copy">One attribute on any element; the controller runs the keyframes. Replay:</p>
          <div class="motion-stage">
            <span class="motion-chip" data-fluid-animation="slide-up" data-fluid-animation-trigger="in-view">slide-up</span>
            <span class="motion-chip" data-fluid-animation="zoom-in" data-fluid-animation-trigger="in-view">zoom-in</span>
            <span class="motion-chip" data-fluid-animation="bounce" data-fluid-animation-trigger="in-view">bounce</span>
            <span class="motion-chip" data-fluid-animation="shake" data-fluid-animation-trigger="in-view">shake</span>
          </div>
          <fluid-button id="motion-replay" variant="secondary" size="sm"><fluid-icon slot="prefix" name="sparkles"></fluid-icon>Replay</fluid-button>
          <pre class="motion-code"><code>&lt;div data-fluid-animation="slide-up"
     data-fluid-animation-trigger="in-view"&gt;…&lt;/div&gt;</code></pre>
        </fluid-card>
      </div>
      <p class="motion-cta"><a class="landing-button" href="/animations.html">Try all 31 effects in the showcase <fluid-icon name="arrow-right"></fluid-icon></a></p>
    </div>
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
    <p class="subhead">Four things Fluid does that most component libraries do not.</p>
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
    <p class="subhead">A taste of the library, every element sharing one set of tokens. Change the theme, or drop in a brand preset, and they all retheme at once.</p>
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
    <p class="subhead">The <code>@fluid-ds/charts</code> pack reads the same tokens, so dashboards match your brand with no extra work. Try the theme switcher in the top bar: both charts repaint live.</p>
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
      whole app. Light and dark are a single attribute, and installable presets go as far as the
      frosted Glass and graphite Titanium takeovers in the switcher above. The
      <a href="/docs/theming/basics/">theming guide</a> has the full model, and the
      <a href="/playground/">theme builder</a> lets you design a brand right in the browser.
    </fluid-callout>
  </section>

  <!-- ====================== WHAT'S NEW (v0.4) ====================== -->
  <section class="row" id="whatsnew">
    <h2>New in <span class="accent">v0.4</span></h2>
    <p class="subhead">This release: a standalone animation system, ink-true signature capture, managed table columns, built-in field labels, a multi-pick typeahead, and a folding divider.</p>
    <div class="whatsnew-grid">
      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">@fluid-ds/animations</code>
        <p class="wn-blurb">Motion is now its own package: attribute-driven keyframes plus 31 canvas effects that wind down gracefully instead of hard-cutting. It needs no other Fluid code.</p>
        <div class="wn-stage">
          <fluid-button id="wn-butterflies" variant="secondary">🦋 Release the butterflies</fluid-button>
        </div>
      </fluid-card>

      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">&lt;fluid-signature-pad&gt;</code>
        <p class="wn-blurb">Signatures captured as ink, not pixels: lossless redraw, per-stroke undo, pressure-aware lines, crisp export. Try it.</p>
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
    <p class="subhead">The same admin portal, built four times: plain HTML, React, Next.js, and Angular. Open them side by side. The repository also maintains tested Vue, Astro, and SvelteKit consumers; the docs spell out exactly what each one verifies.</p>
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
        <h2 style="margin:0;">Free, open source, and staying that way</h2>
        <p class="subhead" style="margin:0.5rem auto 1.5rem;">Fluid is MIT licensed: no license fees, no seat pricing, no paid tier. Free for personal and commercial use, now and in the future. Credit is appreciated, never required. Stars, issues, and PRs are welcome.</p>
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
    <p>Fluid is open source and MIT licensed: free for any use, no license key, attribution appreciated but never required. Built by
      <a href="https://rheijnen.github.io" target="_blank" rel="noopener">René Heijnen</a>.</p>
  </footer>
`;

/* ---------------------------------------------------------------- */
/* Live theme switcher in the nav: flip data-fluid-brand /           */
/* data-fluid-theme on <html> and the whole page (charts included)   */
/* re-themes. Same attributes a consuming app sets; the charts       */
/* observe the document element and repaint themselves. A brand can  */
/* change fonts and paddings, so the measurement overlay re-derives. */
/* ---------------------------------------------------------------- */
const html = document.documentElement;
document.getElementById("site-brand")?.addEventListener("fluid-change", (e) => {
  const value = String((e as CustomEvent).detail?.value ?? "default");
  if (value === "default") html.removeAttribute("data-fluid-brand");
  else html.setAttribute("data-fluid-brand", value);
  requestAnimationFrame(() => refreshPortalAnnotations());
});
document.getElementById("site-dark")?.addEventListener("click", () => {
  const dark = html.getAttribute("data-fluid-theme") === "dark";
  html.setAttribute("data-fluid-theme", dark ? "light" : "dark");
});

/* ---------------------------------------------------------------- */
/* Chart data. The chart components read Fluid tokens themselves and  */
/* re-theme on attribute changes, so we only feed them data here.     */
/* ---------------------------------------------------------------- */
/* ---------------------------------------------------------------- */
/* Hero theme cycler. Every few seconds the collage stage flips       */
/* data-fluid-brand to the next REAL installable preset, so what the  */
/* visitor watches is exactly what `@fluid-ds/themes` ships: nothing  */
/* is simulated with hand-tuned token maps. styles.css registers the  */
/* shared tokens with @property and declares transitions on           */
/* .hero-stage, so each brand hand-off tweens instead of snapping.    */
/* ---------------------------------------------------------------- */
const heroStage = document.querySelector<HTMLElement>(".hero-stage");
/* "" is the clean default: removing the attribute returns the stage to the
   page theme. The loop runs forever: default, glass, corporate, orchid. */
const HERO_BRAND_STEPS = ["", "glass", "corporate", "orchid"] as const;
const heroReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let heroThemeStep = 0;
let heroStageInView = true;
if (heroStage) {
  new IntersectionObserver(
    (entries) => {
      heroStageInView = entries[0]?.isIntersecting ?? true;
    },
    { threshold: 0.15 }
  ).observe(heroStage);
  window.setInterval(() => {
    /* Decorative motion: hold still for reduced-motion users, hidden tabs,
       and whenever the collage is scrolled out of view. */
    if (heroReducedMotion.matches || document.hidden || !heroStageInView) return;
    heroThemeStep = (heroThemeStep + 1) % HERO_BRAND_STEPS.length;
    const brand = HERO_BRAND_STEPS[heroThemeStep] ?? "";
    if (brand) heroStage.setAttribute("data-fluid-brand", brand);
    else heroStage.removeAttribute("data-fluid-brand");
  }, 3200);
}

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

/* Demo-portal charts. The segmented control swaps the line chart's range. */
const PORTAL_RANGES: Record<string, { labels: string[]; data: number[] }> = {
  weekly: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [14, 18, 16, 24, 22, 31, 28]
  },
  monthly: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    data: [42, 55, 49, 63, 58, 72, 69, 84, 78, 91, 88, 104]
  },
  yearly: { labels: ["2022", "2023", "2024", "2025", "2026"], data: [220, 385, 540, 760, 918] }
};
const portalLine = document.getElementById("portal-line") as
  | (HTMLElement & { data?: unknown })
  | null;
const feedPortalLine = (range: string) => {
  const r = PORTAL_RANGES[range] ?? PORTAL_RANGES.monthly;
  if (portalLine && r) {
    portalLine.data = {
      labels: r.labels,
      datasets: [{ label: "Revenue", data: r.data, tension: 0.4, fill: true }]
    };
    /* Single series: the legend chip adds nothing. */
    (portalLine as HTMLElement & { options?: unknown }).options = {
      plugins: { legend: { display: false } }
    };
  }
};
feedPortalLine("monthly");
document.getElementById("portal-range")?.addEventListener("fluid-change", (e) => {
  feedPortalLine(String((e as CustomEvent).detail?.value ?? "monthly"));
});

/*
 * Demo-portal theme switcher. Each choice is a real @fluid-ds/themes brand,
 * applied by flipping data-fluid-brand on the portal frame alone, so only the
 * demo re-themes and the choice is exactly what a consumer would install.
 */
/* The canvas charts read their colours once, at draw time, and observe theme
   attributes on the document element rather than on this subtree, so a brand or
   scheme flip on the frame leaves them stale. Ask both to repaint. */
function repaintPortalCharts(): void {
  (portalLine as (HTMLElement & { refresh?: () => void }) | null)?.refresh?.();
  const donut = document.getElementById("portal-donut") as
    | (HTMLElement & { refresh?: () => void })
    | null;
  donut?.refresh?.();
}

/*
 * Live token measurements, in the style of PrimeNG's theme designer. An SVG
 * overlay draws the geometry directly on the live components: outline circles
 * that trace each corner's border-radius, red calipers spanning padding, and a
 * green caliper spanning the font size, each with a value label. Everything is
 * measured from the rendered elements (via getBoundingClientRect + computed
 * style), so it re-derives whenever the theme changes. Targets are picked to
 * show generic vs per-element control: the KPI card carries the card radius and
 * padding, while the Download button carries its own tighter inner padding,
 * measured separately. The accent resolves through a var() chain, so a hidden
 * probe inside the frame carries it as a real `color` we read back.
 */
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(name: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}
function rgbToHex(rgb: string): string {
  const parts = rgb.match(/\d+(\.\d+)?/g);
  if (!parts || parts.length < 3) return rgb;
  return `#${parts
    .slice(0, 3)
    .map((v) => Math.round(Number(v)).toString(16).padStart(2, "0"))
    .join("")}`;
}
/** Like rgbToHex, but keeps a translucent alpha visible ("#ffffff 62%"),
 *  which is exactly what distinguishes a frosted surface from an opaque one. */
function formatSurfaceColor(css: string): string {
  const hex = rgbToHex(css);
  const parts = css.match(/[\d.]+/g);
  const alpha = parts && parts.length >= 4 ? Math.round(Number(parts[3]) * 100) : 100;
  return alpha < 100 ? `${hex} ${alpha}%` : hex;
}
function pxToRem(px: number): string {
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return `${+(px / root).toFixed(3)}rem`;
}
function partOf(host: Element | null | undefined, part: string): Element | null {
  return host?.shadowRoot?.querySelector(`[part="${part}"]`) ?? null;
}
function updatePortalAnnotations(): void {
  const stage = document.querySelector<HTMLElement>(".portal-stage");
  const svg = document.getElementById("portal-measure-svg");
  const labels = document.getElementById("portal-measure-labels");
  const probe = document.getElementById("portal-annotation-probe");
  if (!stage || !svg || !labels) return;
  const origin = stage.getBoundingClientRect();
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  labels.textContent = "";
  const num = (v: string) => parseFloat(v) || 0;
  const boxOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left - origin.left,
      y: r.top - origin.top,
      x2: r.right - origin.left,
      y2: r.bottom - origin.top
    };
  };
  const line = (x1: number, y1: number, x2: number, y2: number, cls: string) =>
    svg.appendChild(svgEl("line", { x1, y1, x2, y2, class: cls }));
  // A caliper: the span line plus a short perpendicular cap at each end.
  const caliper = (x1: number, y1: number, x2: number, y2: number, cls: string) => {
    line(x1, y1, x2, y2, cls);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 4;
    const ny = (dx / len) * 4;
    line(x1 - nx, y1 - ny, x1 + nx, y1 + ny, cls);
    line(x2 - nx, y2 - ny, x2 + nx, y2 + ny, cls);
  };
  // A radius indicator: a quarter arc concentric with the rounded corner,
  // floated ARC_OFF outside the edge so it annotates the shape without ever
  // touching the control (an on-edge arc in a matching hue read as a broken
  // corner). Full circles looked fine at 8px but became giant rings over the
  // content under large-radius brands like Glass. `corner` is "tl" or "tr".
  const ARC_OFF = 3;
  const cornerArc = (
    box: { x: number; y: number; x2: number; y2: number },
    rad: number,
    corner: "tl" | "tr"
  ) => {
    if (rad < 2) return;
    const r = rad + ARC_OFF;
    const d =
      corner === "tl"
        ? `M ${box.x + rad} ${box.y - ARC_OFF} A ${r} ${r} 0 0 0 ${box.x - ARC_OFF} ${box.y + rad}`
        : `M ${box.x2 - rad} ${box.y - ARC_OFF} A ${r} ${r} 0 0 1 ${box.x2 + ARC_OFF} ${box.y + rad}`;
    svg.appendChild(svgEl("path", { d, fill: "none", class: "mm-radius" }));
  };
  /** Offset of the arc's 45-degree midpoint from the box corner, for anchors. */
  const arcAnchorInset = (rad: number): number => rad - (rad + ARC_OFF) * Math.SQRT1_2;
  /*
   * Chips are laid out AFTER all measurements are collected: every value pill
   * sits in the clear margin beside the portal frame (falling back to just
   * inside the frame edge when the viewport leaves no wing room), vertically
   * collision-resolved, with a dashed leader line running to a small dot on
   * the geometry it measures. Keeping the chips out of the dashboard is what
   * keeps them legible: the UI underneath stays untouched.
   */
  interface MeasureChip {
    text: string;
    cls: string;
    stroke: string;
    side: "left" | "right";
    anchorX: number;
    anchorY: number;
  }
  const chips: MeasureChip[] = [];
  const chip = (
    text: string,
    cls: string,
    stroke: string,
    side: MeasureChip["side"],
    anchorX: number,
    anchorY: number
  ) => chips.push({ text, cls, stroke, side, anchorX, anchorY });

  // KPI card: corner-radius circles + a red caliper spanning the top padding.
  const cardBase = partOf(document.querySelector(".kpi-balance"), "base");
  const cardFirst = document.querySelector(".kpi-balance .kpi-top");
  if (cardBase) {
    const b = boxOf(cardBase);
    const rad = num(getComputedStyle(cardBase).borderTopLeftRadius);
    cornerArc(b, rad, "tl");
    cornerArc(b, rad, "tr");
    // Visual top padding: the gap from the card border to its first content,
    // which is what the eye reads as the inset (the card pads its `base`, so
    // there is no inner part to diff).
    const padTop = cardFirst
      ? boxOf(cardFirst).y - b.y
      : num(getComputedStyle(cardBase).paddingTop);
    const cx = b.x + 18;
    caliper(cx, b.y, cx, b.y + padTop, "mm-padding");
    // Anchor the radius chip on the arc's midpoint (45 degrees around the corner).
    const arcMid = arcAnchorInset(rad);
    chip(`radius: ${pxToRem(rad)}`, "mm-l-radius", "mm-radius", "left", b.x + arcMid, b.y + arcMid);
    chip(`padding: ${pxToRem(padTop)}`, "mm-l-padding", "mm-padding", "left", cx, b.y + padTop / 2);
    // The card's surface fill: opaque in most brands, translucent frost under
    // Glass, which the alpha in the value makes visible. Anchored on an empty
    // patch of the card near its bottom-left corner.
    chip(
      `surface: ${formatSurfaceColor(getComputedStyle(cardBase).backgroundColor)}`,
      "mm-l-surface",
      "mm-surface",
      "left",
      b.x + 16,
      b.y2 - 16
    );
  }

  // Download button: its own radius + inner padding (measured separately from
  // the card), plus the resolved primary colour read off the probe.
  const btnHost = [...document.querySelectorAll<HTMLElement>(".portal-frame fluid-button")].find(
    (el) => /Download/i.test(el.textContent ?? "")
  );
  const btnBase = partOf(btnHost, "base");
  if (btnBase) {
    const bb = boxOf(btnBase);
    const cs = getComputedStyle(btnBase);
    // The label-side (right) padding is the representative inner padding: the
    // icon side is deliberately a step tighter, so measuring it would mislead.
    const padR = num(cs.paddingRight);
    const yc = (bb.y + bb.y2) / 2;
    caliper(bb.x2 - padR, yc, bb.x2, yc, "mm-padding");
    // The button's own corner radius, measured separately from the card's:
    // the two values differing is the point (component tokens override the
    // generic radius). Same arc treatment, on the corner away from the
    // primary dot and the padding caliper.
    const btnRad = num(cs.borderTopLeftRadius);
    cornerArc(bb, btnRad, "tl");
    const btnArcMid = arcAnchorInset(btnRad);
    chip(
      `button radius: ${pxToRem(btnRad)}`,
      "mm-l-radius",
      "mm-radius",
      "right",
      bb.x + btnArcMid,
      bb.y + btnArcMid
    );
    if (probe) {
      const hex = rgbToHex(getComputedStyle(probe).color);
      chip(`primary: ${hex}`, "mm-l-primary", "mm-primary", "right", bb.x2 - 4, bb.y + 3);
    }
    chip(
      `button pad: ${pxToRem(padR)}`,
      "mm-l-padding",
      "mm-padding",
      "right",
      bb.x2 - padR / 2,
      yc
    );
  }

  // Body text: green caliper spanning the font size at the text's right end,
  // where there is open space. The header sub-line is normal body copy, so it
  // reads the base font size rather than a display number.
  const text =
    document.querySelector<HTMLElement>(".portal-frame .portal-sub") ??
    document.querySelector<HTMLElement>(".portal-frame .kpi-top");
  if (text) {
    const t = boxOf(text);
    const fs = num(getComputedStyle(text).fontSize);
    const x = t.x2 + 16;
    const y1 = t.y + (t.y2 - t.y - fs) / 2;
    caliper(x, y1, x, y1 + fs, "mm-font");
    chip(`fontSize: ${Math.round(fs)}px`, "mm-l-font", "mm-font", "right", x, y1 + fs / 2);
  }

  // Lay the chips out beside the frame and connect each to its geometry.
  const frame = document.querySelector<HTMLElement>(".portal-frame");
  if (frame && chips.length) {
    const f = boxOf(frame);
    // Wing room per side: the free viewport margin beside the stage. A chip
    // is ~170px including its leader gap; with less room than that, tuck the
    // side's chips just inside the frame edge instead of clipping offscreen.
    const stageRect = stage.getBoundingClientRect();
    const wingFor = (side: "left" | "right"): boolean =>
      (side === "left" ? stageRect.left : document.documentElement.clientWidth - stageRect.right) >=
      170;
    const CHIP_GAP = 26;
    for (const side of ["left", "right"] as const) {
      const outside = wingFor(side);
      const group = chips.filter((c) => c.side === side).sort((a, b) => a.anchorY - b.anchorY);
      // Tucked-inside right chips would land on the controls they measure
      // (the Download button lives at that edge), so in that mode they stack
      // in the empty top-right lane instead and let the leaders travel.
      const stackFromTop = !outside && side === "right";
      let prevY = stackFromTop ? f.y + 20 : -Infinity;
      for (const c of group) {
        const y = stackFromTop
          ? prevY + CHIP_GAP
          : Math.max(f.y + 14, Math.max(c.anchorY, prevY + CHIP_GAP));
        prevY = y;
        const edgeX = side === "left" ? f.x - 14 : f.x2 + 14;
        const x = outside ? edgeX : side === "left" ? f.x + 12 : f.x2 - 12;
        const d = document.createElement("div");
        const align = outside
          ? side === "left"
            ? "mm-align-end"
            : "mm-align-start"
          : side === "left"
            ? "mm-align-start"
            : "mm-align-end";
        d.className = `mm-label ${c.cls} ${align}`;
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
        d.textContent = c.text;
        labels.appendChild(d);
        // Dashed leader from the chip to a dot on the measured geometry.
        line(x, y, c.anchorX, c.anchorY, `mm-lead ${c.stroke}`);
        svg.appendChild(
          svgEl("circle", { cx: c.anchorX, cy: c.anchorY, r: 3, class: `mm-dot ${c.stroke}` })
        );
      }
    }
  }
}
/* The portal frame tweens its re-theme (colors, radii), so a measurement
   taken at the instant of a brand or scheme flip reads mid-transition values
   (e.g. the surface still opaque on the way to frosted). Measure immediately
   for responsiveness, then once more after the transition has settled. */
let annotationSettleTimer: ReturnType<typeof setTimeout> | undefined;
function refreshPortalAnnotations(): void {
  updatePortalAnnotations();
  clearTimeout(annotationSettleTimer);
  annotationSettleTimer = setTimeout(() => updatePortalAnnotations(), 1250);
}
requestAnimationFrame(() => updatePortalAnnotations());
window.addEventListener("resize", () => updatePortalAnnotations());

/* The Measurements switch shows/hides the overlay (on by default); redraw on
   enable so the marks match the current layout. */
document.getElementById("portal-annotations")?.addEventListener("fluid-change", (e) => {
  const on = Boolean((e as CustomEvent).detail?.checked);
  document.querySelector(".portal-stage")?.classList.toggle("annotations-off", !on);
  if (on) refreshPortalAnnotations();
});

/*
 * Motion demo. Each effect button fires the matching burst from its own
 * on-screen position (origin: the button), so the confetti erupts where you
 * clicked. Snow is ambient, so it toggles. The attribute chips already play on
 * scroll-in; the Replay button re-runs them through the controller's imperative
 * trigger, the same call a `manual` trigger would use.
 */
// Finite bursts self-terminate; the ambient ones (snow, sparkles, butterflies)
// get a bounded duration so they play for a beat and fizzle out, never running on.
const MOTION_BURSTS = { confetti, fireworks, pride, hearts, stars };
document.querySelectorAll<HTMLElement>("[data-effect]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.effect ?? "";
    if (name === "snow") {
      snow({ duration: 2600 });
      return;
    }
    if (name === "butterflies") {
      butterflies({ duration: 5000, rate: 2 });
      return;
    }
    if (name === "sparkles") {
      sparkles({ origin: btn, duration: 1600 });
      return;
    }
    MOTION_BURSTS[name as keyof typeof MOTION_BURSTS]?.({ origin: btn });
  });
});
// The v0.4 card's own release valve.
document.getElementById("wn-butterflies")?.addEventListener("click", () => {
  butterflies({ duration: 4500, rate: 3 });
});
document.getElementById("motion-replay")?.addEventListener("click", () => {
  document
    .querySelectorAll<HTMLElement>(".motion-chip")
    .forEach((chip) => playElementAnimation(chip));
});

document.getElementById("portal-theme")?.addEventListener("fluid-change", (e) => {
  const value = String((e as CustomEvent).detail?.value ?? "default");
  const frame = document.querySelector<HTMLElement>(".portal-frame");
  if (!frame) return;
  if (value === "default") frame.removeAttribute("data-fluid-brand");
  else frame.setAttribute("data-fluid-brand", value);
  repaintPortalCharts();
  refreshPortalAnnotations();
});

/*
 * Demo-portal light/dark toggle. Flips data-fluid-theme on the frame alone, so
 * only the demo re-schemes, exactly the attribute a consumer sets. It sits on
 * the same element as data-fluid-brand, which is why the brand files carry a
 * `[data-fluid-brand][data-fluid-theme="dark"]` compound rule: brand and scheme
 * compose on one node.
 */
document.getElementById("portal-appearance")?.addEventListener("fluid-change", (e) => {
  const value = String((e as CustomEvent).detail?.value ?? "light");
  const frame = document.querySelector<HTMLElement>(".portal-frame");
  if (!frame) return;
  frame.setAttribute("data-fluid-theme", value === "dark" ? "dark" : "light");
  repaintPortalCharts();
  refreshPortalAnnotations();
});

const portalDonut = document.getElementById("portal-donut") as
  | (HTMLElement & { data?: unknown; options?: unknown })
  | null;
if (portalDonut) {
  portalDonut.data = {
    labels: ["Direct", "Search", "Referral", "Social"],
    datasets: [{ data: [42, 31, 17, 10] }]
  };
  /* The card carries its own breakdown list, so the default legend is noise. */
  portalDonut.options = { plugins: { legend: { display: false } } };
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
/* Guided product tour: walk the nav theme switcher, the demo        */
/* portal, the motion band, the v0.4 showcase, and the dashboards.   */
/* Targets are light-DOM ids/classes, so the tour resolves them via  */
/* its document fallback.                                            */
/* ---------------------------------------------------------------- */
const tour = document.getElementById("page-tour") as
  | (HTMLElement & { steps?: unknown; show?: () => void })
  | null;
if (tour) {
  tour.steps = [
    {
      target: ".nav-theme",
      title: "Theme the whole page",
      body: "Pick a brand and flip dark mode from the top bar. Every component on this page, charts included, recolors live from the same tokens.",
      placement: "bottom"
    },
    {
      target: "#portal-demo",
      title: "A live app, not a screenshot",
      body: "Everything in this window is a real Fluid component. Re-brand it, flip its appearance, or switch on live token measurements.",
      placement: "top"
    },
    {
      target: "#motion",
      title: "Motion, standalone",
      body: "Keyframes from one attribute plus 31 canvas effects. The package ships alone and works in any framework or none.",
      placement: "top"
    },
    {
      target: "#whatsnew",
      title: "New in v0.4",
      body: "A standalone animation system, ink-true signature capture, managed table columns, built-in field labels, and a multi-pick typeahead.",
      placement: "top"
    },
    {
      target: ".chart-grid",
      title: "Data viz, on-brand",
      body: "The charts pack reads the same tokens, so dashboards match your brand with no extra work.",
      placement: "top"
    }
  ];
  document.getElementById("start-tour")?.addEventListener("click", () => tour.show?.());
}
