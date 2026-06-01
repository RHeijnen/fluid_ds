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
import {
  confetti,
  fireworks,
  emojiBurst,
  pride,
  sparkles,
  snow,
  stars,
  hearts,
  emojiFountain,
  bubbles
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
  ["blocks", "101 components, no framework", "Standard custom elements. Drop the tags into React, Vue, Angular, Svelte, Solid, or a plain HTML file. Same code, same result."],
  ["palette", "Theme with one variable", "A small palette of semantic tokens drives everything. Override one value, retheme the whole app. Down to a single element if you want."],
  ["circle-check", "Accessible by default", "Every component ships the right ARIA pattern, keyboard support, 24px targets, and an axe audit. AA today, AAA on a switch."],
  ["sparkles", "Lean core, opt-in power", "The core stays small. Charts, data grids, calendars, a scheduler, a rich-text editor, kanban, maps, media, and more live in separate packages you add only when you need them."]
];

const stats = [
  ["101", "components"],
  ["12", "expansion packs"],
  ["4", "frameworks proven"],
  ["1,000+", "tests passing"],
  ["AA", "WCAG 2.2 (AAA opt-in)"],
  ["1,500+", "icons available"]
];

const packs = [
  ["@fluid-ds/charts", "Chart.js-backed line, bar, doughnut, sparkline and more, themed by your tokens."],
  ["@fluid-ds/scheduler", "Appointment scheduler: calendar with bookable time slots, plus an hours editor."],
  ["@fluid-ds/table", "Accessible data grid: sortable, selectable, semantic table."],
  ["@fluid-ds/calendar", "Event calendar: a month view of events."],
  ["@fluid-ds/editor", "Lightweight accessible rich-text editor."],
  ["@fluid-ds/kanban", "Drag-and-drop board with a full keyboard path."],
  ["@fluid-ds/map", "Themed Leaflet map wrapper with markers."],
  ["@fluid-ds/media", "Video player, playlists, animated images, zoomable frames, audio, lightbox."],
  ["@fluid-ds/markdown", "Render Markdown to themed HTML with one element."],
  ["@fluid-ds/qr", "Themable QR codes as crisp SVG, including logo-embedded fancy codes."],
  ["@fluid-ds/parser", "Drag JSON, CSV or Excel onto a file-drop and parse it against a blueprint."],
  ["@fluid-ds/animations", "Keyframe animations plus event effects like confetti, reduced-motion aware."]
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
  ["Next.js", "App Router, SSR-safe.", "/demos/next/"],
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
      <a class="cta" href="${GH}" target="_blank" rel="noopener" aria-label="GitHub repository">
        <fluid-button size="sm" variant="secondary">
          <fluid-icon slot="prefix" name="github"></fluid-icon>
          GitHub
        </fluid-button>
      </a>
    </nav>
  </header>

  <!-- ============================ HERO ============================ -->
  <section class="hero">
    <div class="hero-badges">
      <fluid-badge variant="info">v0.3 alpha</fluid-badge>
      <fluid-badge variant="success">WCAG 2.2 AA · AAA-ready</fluid-badge>
      <fluid-badge>npm: @fluid-ds/*@alpha</fluid-badge>
      <fluid-badge>MIT licensed</fluid-badge>
    </div>
    <h1>Build it once.<br /><span class="accent">Drop it anywhere.</span></h1>
    <p class="lead">
      A framework-agnostic design system of <strong>101 standard web components</strong>,
      themable down to a single CSS variable and accessible out of the box.
      Works in every framework, and in the page that doesn't have one.
    </p>
    <div class="hero-actions">
      <a href="/docs/" style="text-decoration:none;">
        <fluid-button>Get started <fluid-icon slot="suffix" name="arrow-right"></fluid-icon></fluid-button>
      </a>
      <a href="/playground/" style="text-decoration:none;">
        <fluid-button variant="secondary">Open the theme builder</fluid-button>
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
      ${features.map(([icon, title, body]) => `
        <fluid-card variant="outline">
          <div class="feature-head"><fluid-icon name="${icon}" style="--fluid-icon-size:1.5rem;"></fluid-icon><strong>${title}</strong></div>
          <p style="margin:0; color:var(--fluid-text-secondary);">${body}</p>
        </fluid-card>`).join("")}
    </div>
  </section>

  <!-- ====================== COMPONENT WALL ====================== -->
  <section class="row">
    <h2>One design language, 57 ways</h2>
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
      <a href="/storybook/" style="text-decoration:none;"><fluid-button variant="secondary">See all 101 in Storybook <fluid-icon slot="suffix" name="arrow-right"></fluid-icon></fluid-button></a>
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
    <p class="subhead">Three fresh ways to delight: logo-embedded QR codes, drag-and-drop file parsing, and a celebration effects engine.</p>
    <div class="whatsnew-grid">
      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">@fluid-ds/qr</code>
        <p class="wn-blurb">Scannable QR codes with your logo in the centre, dot modules, and recoloured finder eyes.</p>
        <div class="wn-stage">
          <fluid-qr-code id="wn-qr" value="https://fluid-web.dev" size="156"
            module-shape="dots" eye-shape="rounded" eye-color="var(--fluid-accent-base)" logo-size="0.24"></fluid-qr-code>
        </div>
      </fluid-card>

      <fluid-card variant="outline" class="wn-card" id="fx-card">
        <code class="pack-name">@fluid-ds/animations</code>
        <p class="wn-blurb">A tiny canvas effects engine: confetti, fireworks, emoji bursts, and more. Reduced-motion aware.</p>
        <div class="wn-stage fx-actions">
          <fluid-button id="fx-confetti" variant="primary" size="sm"><fluid-icon slot="prefix" name="sparkles"></fluid-icon>Confetti</fluid-button>
          <fluid-button id="fx-fireworks" variant="secondary" size="sm">Fireworks</fluid-button>
          <fluid-button id="fx-emoji" variant="secondary" size="sm">Emoji</fluid-button>
          <fluid-button id="fx-pride" variant="secondary" size="sm">Pride</fluid-button>
          <fluid-button id="fx-snow" variant="secondary" size="sm">Snow</fluid-button>
          <fluid-button id="fx-sparkles" variant="secondary" size="sm">Sparkles</fluid-button>
          <fluid-button id="fx-stars" variant="secondary" size="sm">Stars</fluid-button>
          <fluid-button id="fx-hearts" variant="secondary" size="sm">Hearts</fluid-button>
          <fluid-button id="fx-fountain" variant="secondary" size="sm">Fountain</fluid-button>
          <fluid-button id="fx-bubbles" variant="secondary" size="sm">Bubbles</fluid-button>
        </div>
      </fluid-card>

      <fluid-card variant="outline" class="wn-card">
        <code class="pack-name">@fluid-ds/parser</code>
        <p class="wn-blurb">Drop a JSON, CSV, or Excel file and parse it against a blueprint: typed, validated rows out.</p>
        <div class="wn-stage">
          <div class="wn-parser">
            <div class="wn-drop"><fluid-icon name="upload"></fluid-icon><span>members.csv</span></div>
            <fluid-meter value="312" max="320" label="Rows valid" style="width:100%;"></fluid-meter>
            <span class="wn-parser-note">312 of 320 rows valid &middot; 8 flagged</span>
          </div>
        </div>
      </fluid-card>
    </div>
  </section>

  <!-- ====================== EXPANSION PACKS ====================== -->
  <section class="row">
    <h2>Lean core, opt-in power</h2>
    <p class="subhead">Twelve expansion packs keep the base bundle small. Add only what you reach for.</p>
    <div class="feature-grid">
      ${packs.map(([name, body]) => `
        <fluid-card variant="outline">
          <code class="pack-name">${name}</code>
          <p style="margin:0.5rem 0 0; color:var(--fluid-text-secondary); font-size:0.95rem;">${body}</p>
        </fluid-card>`).join("")}
    </div>
  </section>

  <!-- ====================== SURFACES / TOOLING ====================== -->
  <section class="row">
    <h2>Four ways to work with it</h2>
    <p class="subhead">Documented, explorable, designable, and configurable, all from the same components.</p>
    <div class="feature-grid">
      ${surfaces.map(([title, body, href]) => `
        <a href="${href}" class="surface-card">
          <fluid-card variant="outline">
            <strong>${title} <fluid-icon name="arrow-right" style="--fluid-icon-size:0.9rem;"></fluid-icon></strong>
            <p style="margin:0.4rem 0 0; color:var(--fluid-text-secondary); font-size:0.95rem;">${body}</p>
          </fluid-card>
        </a>`).join("")}
    </div>
  </section>

  <!-- ====================== FRAMEWORKS ====================== -->
  <section class="row">
    <h2>Don't take "agnostic" on faith</h2>
    <p class="subhead">Standard custom elements run in every framework, and in none. As proof, here's the same admin portal, the same components, built in plain HTML, React, Next.js, and Angular (Vue, Svelte, and Solid work just the same). Pixel-for-pixel identical.</p>
    <div class="feature-grid">
      ${frameworks.map(([title, body, href]) => `
        <a href="${href}" class="surface-card">
          <fluid-card variant="outline">
            <strong>${title} <fluid-icon name="arrow-right" style="--fluid-icon-size:0.9rem;"></fluid-icon></strong>
            <p style="margin:0.4rem 0 0; color:var(--fluid-text-secondary); font-size:0.95rem;">${body}</p>
          </fluid-card>
        </a>`).join("")}
    </div>
  </section>

  <!-- ====================== SETUP ====================== -->
  <section class="row">
    <h2>Five-line setup</h2>
    <p class="subhead">Paste into any HTML page. No bundler, no framework, no build step.</p>
    <fluid-code-block language="html" code='<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@alpha/dist/base.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@alpha/dist/light.css" />

<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/icons@alpha/dist/register-defaults.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/components@alpha/dist/components/button/define.js"></script>

<fluid-button>Hello, Fluid</fluid-button>'></fluid-code-block>
    <p class="subhead" style="margin-top:1rem;">Prefer npm? <code>npm i @fluid-ds/components@alpha</code>. Full <a href="/docs/getting-started/installation/">installation guide</a>.</p>
  </section>

  <!-- ====================== OPEN SOURCE CTA ====================== -->
  <section class="row cta-row">
    <fluid-card variant="outline">
      <div class="cta-inner">
        <h2 style="margin:0;">Open source, on the platform you trust</h2>
        <p class="subhead" style="margin:0.5rem auto 1.5rem;">MIT licensed, built on standard web APIs, and developed in the open. Stars, issues, and PRs welcome.</p>
        <div class="hero-actions">
          <a href="${GH}" target="_blank" rel="noopener" style="text-decoration:none;">
            <fluid-button><fluid-icon slot="prefix" name="github"></fluid-icon>View on GitHub</fluid-button></a>
          <a href="https://www.npmjs.com/package/@fluid-ds/components" target="_blank" rel="noopener" style="text-decoration:none;">
            <fluid-button variant="secondary">View on npm</fluid-button></a>
          <a href="/docs/" style="text-decoration:none;"><fluid-button variant="ghost">Read the docs</fluid-button></a>
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
/* New in v0.3: live QR logo, the effects engine buttons, a subtle   */
/* one-time celebration when the section scrolls in, and the tour.   */
/* ---------------------------------------------------------------- */

// A small inline "F" mark for the QR logo (data URI, brand accent).
const QR_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='11' fill='%234f46e5'/%3E%3Ctext x='24' y='33' font-size='27' font-weight='700' font-family='Inter,system-ui,sans-serif' fill='white' text-anchor='middle'%3EF%3C/text%3E%3C/svg%3E";
const wnQr = document.getElementById("wn-qr") as (HTMLElement & { logo?: string }) | null;
if (wnQr) wnQr.logo = QR_LOGO;

// Effects engine, fired from the "New in v0.3" buttons (origin = the button).
// Bursts (confetti, emoji, fireworks, pride, stars, hearts) self-terminate.
// Ambient effects (snow, sparkles, fountain, bubbles) stop SPAWNING after their
// `duration`, then let the particles already on screen finish naturally: each
// drifts / falls off the viewport and is dropped, and the shared overlay canvas
// tears itself down once the last particle is gone. No hard stop, so nothing is
// yanked off screen mid-flight.
const fromEl = (id: string, run: (el: HTMLElement) => void): void => {
  const el = document.getElementById(id);
  el?.addEventListener("click", () => run(el));
};
fromEl("fx-confetti", (el) => confetti({ origin: el }));
fromEl("fx-fireworks", () => fireworks());
fromEl("fx-emoji", (el) => emojiBurst({ origin: el, emojis: ["🎉", "✨", "💧", "🫧"] }));
fromEl("fx-pride", (el) => pride({ origin: el }));
fromEl("fx-stars", (el) => stars({ origin: el }));
fromEl("fx-hearts", (el) => hearts({ origin: el }));
fromEl("fx-fountain", (el) => emojiFountain({ origin: el, duration: 2500 }));
fromEl("fx-snow", () => snow({ duration: 2500 }));
fromEl("fx-sparkles", (el) => sparkles({ origin: el, duration: 2500 }));
fromEl("fx-bubbles", () => bubbles({ duration: 2500 }));

// Subtle, one-time delight: when the effects card first scrolls into view,
// shimmer a few sparkles from it. The engine no-ops under reduced-motion.
const fxCard = document.getElementById("fx-card");
if (fxCard && "IntersectionObserver" in window) {
  let played = false;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !played) {
          played = true;
          sparkles({ origin: fxCard, duration: 2200 });
          io.disconnect();
        }
      }
    },
    { threshold: 0.6 }
  );
  io.observe(fxCard);
}

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
      title: "New in v0.3",
      body: "Logo-embedded QR codes, blueprint-driven file parsing, and a celebration effects engine. Try the confetti.",
      placement: "top"
    },
    {
      target: "#fx-confetti",
      title: "A little delight",
      body: "The effects engine fires from any element and is reduced-motion aware. Go on, press it.",
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
