import "./register-fluid";
import "@fluid-ds/themes/titanium.css";
import "@fluid-ds/themes/rainbow.css";
import "@fluid-ds/icons/lucide/copy";
import "@fluid-ds/icons/lucide/check";
import "@fluid-ds/icons/lucide/heart";
import "@fluid-ds/icons/lucide/arrow-right";
import "@fluid-ds/icons/lucide/sparkles";
import "@fluid-ds/icons/lucide/palette";
import "@fluid-ds/icons/lucide/package";
import "@fluid-ds/icons/lucide/info";
import "@fluid-ds/components/define/segmented-control";
import "@fluid-ds/rainbow/define";
import {
  rainbowIllustrationGroups,
  rainbowIllustrationNames,
  registerRainbowIllustrations
} from "@fluid-ds/rainbow/illustrations";
import type { FluidRainbowBattery } from "@fluid-ds/rainbow";
import "./styles.css";
import "./rainbow.css";

registerRainbowIllustrations();

const GH = "https://github.com/RHeijnen/fluid_ds";
const root = document.documentElement;

/** Brands offered in the live comparison, in the order they appear. */
const COMPARE_BRANDS = [
  { id: "rainbow", label: "Rainbow" },
  { id: "default", label: "Default" },
  { id: "midnight", label: "Midnight" },
  { id: "titanium", label: "Titanium" }
] as const;

const TOKEN_KNOBS = [
  {
    id: "border",
    label: "Outline width",
    token: "--fluid-border-width-default",
    min: 0,
    max: 6,
    value: 4,
    unit: "px"
  },
  {
    id: "divider",
    label: "Divider width",
    token: "--fluid-border-width-divider",
    min: 0,
    max: 4,
    value: 3,
    unit: "px"
  },
  {
    id: "radius",
    label: "Corner radius",
    token: "--fluid-radius-*",
    min: 0,
    max: 48,
    value: 34,
    unit: "px"
  },
  {
    id: "pop",
    label: "Pop shadow",
    token: "--fluid-shadow-md",
    min: 0,
    max: 10,
    value: 4,
    unit: "px"
  }
] as const;

const kitchenSink = (id: string) => `
  <div class="rbw-sink-grid">
    <fluid-card>
      <span slot="header">Team plan</span>
      <fluid-stat label="Monthly active" value="12,480" change="+8.1%" trend="up"></fluid-stat>
      <fluid-progress-bar value="68" label="Storage used" style="margin-top: 0.75rem"></fluid-progress-bar>
      <div slot="footer" class="rbw-row">
        <fluid-button size="sm">Upgrade</fluid-button>
        <fluid-button size="sm" variant="secondary">Details</fluid-button>
      </div>
    </fluid-card>
    <fluid-card>
      <span slot="header">Preferences</span>
      <div class="rbw-stack">
        <fluid-input label="Display name" value="Robin" id="${id}-name"></fluid-input>
        <fluid-switch checked>Email notifications</fluid-switch>
        <fluid-checkbox checked>Weekly digest</fluid-checkbox>
        <fluid-slider value="60" aria-label="Volume" show-value></fluid-slider>
      </div>
    </fluid-card>
    <fluid-card>
      <span slot="header">Status</span>
      <div class="rbw-stack">
        <div class="rbw-row">
          <fluid-badge variant="success">Paid</fluid-badge>
          <fluid-badge variant="warning">Pending</fluid-badge>
          <fluid-badge variant="info">Beta</fluid-badge>
          <fluid-tag variant="danger">Overdue</fluid-tag>
        </div>
        <fluid-tabs>
          <fluid-tab slot="nav" panel="${id}-a">Overview</fluid-tab>
          <fluid-tab slot="nav" panel="${id}-b">Activity</fluid-tab>
          <fluid-tab-panel name="${id}-a">Everything is running smoothly.</fluid-tab-panel>
          <fluid-tab-panel name="${id}-b">Three deploys today.</fluid-tab-panel>
        </fluid-tabs>
        <fluid-rating value="4" aria-label="Rating"></fluid-rating>
      </div>
    </fluid-card>
  </div>
  <div class="rbw-row rbw-tones">
    <fluid-button>Primary</fluid-button>
    <fluid-button variant="secondary">Secondary</fluid-button>
    <fluid-button variant="ghost">Ghost</fluid-button>
    <fluid-button tone="success">Approve</fluid-button>
    <fluid-button tone="danger" variant="secondary">Delete</fluid-button>
    <fluid-button tone="warning">Review</fluid-button>
  </div>
  <fluid-callout variant="info">Callouts, fields and tabs all follow the same tokens, so nothing needs per-component overrides.</fluid-callout>
`;

document.body.innerHTML = `
  <header class="site-nav">
    <a class="brand" href="/"><fluid-icon name="rainbow-logo" class="rbw-logo"></fluid-icon><span>Fluid <em>Rainbow</em></span></a>
    <nav class="primary" aria-label="Primary">
      <a href="/">Home</a>
      <a href="/docs/">Docs</a>
      <a href="/animations.html">Motion</a>
      <fluid-button id="dark-toggle" variant="ghost" size="sm" aria-label="Toggle dark mode">
        <fluid-icon name="sun-moon"></fluid-icon>
      </fluid-button>
      <a class="cta landing-button secondary compact" href="${GH}" target="_blank" rel="noopener" aria-label="GitHub repository">
        <fluid-icon name="github"></fluid-icon>
        GitHub
      </a>
    </nav>
  </header>

  <main>
    <section class="rbw-hero">
      <div class="rbw-hero-copy">
        <span class="rbw-pill"><span class="rbw-dot" aria-hidden="true"></span>Theme package · new in 1.0</span>
        <h1>Make Fluid <span class="rbw-hl rbw-hl--blue">feel like</span> <span class="rbw-hl rbw-hl--yellow">a home screen.</span></h1>
        <p class="rbw-lead">Rainbow is a theme package for Fluid. One attribute gives every component cream paper, chunky ink outlines, pastel fills and pop shadows. An optional expansion pack adds animated widgets and illustrations. Checked against WCAG AA and AAA, light and dark.</p>
        <div class="rbw-cta">
          <fluid-button size="lg" data-scroll="#install">Get started <fluid-icon slot="suffix" name="arrow-right"></fluid-icon></fluid-button>
          <fluid-button size="lg" variant="secondary" data-scroll="#compare">See it restyle Fluid</fluid-button>
        </div>
        <code class="rbw-install">&lt;html data-fluid-brand="rainbow"&gt;</code>
      </div>

      <div class="rbw-bento" aria-label="Rainbow widgets">
        <fluid-rainbow-landscape class="rbw-b-scene">
          <fluid-rainbow-clock hour-cycle="h23"></fluid-rainbow-clock>
        </fluid-rainbow-landscape>
        <div class="rbw-b-card rbw-b-battery">
          <fluid-rainbow-battery value="99.98" show-value charging pulse>Uptime</fluid-rainbow-battery>
        </div>
        ${["rainbow-chat", "rainbow-music", "rainbow-gallery", "rainbow-game"]
          .map((n) => `<fluid-icon class="rbw-b-ill" name="${n}"></fluid-icon>`)
          .join("")}
        <fluid-icon class="rbw-b-ill" name="rainbow-clock"></fluid-icon>
        <div class="rbw-b-cal" aria-hidden="true">
          <span class="rbw-b-month"><b id="cal-month">APR</b></span>
          <span id="cal-days" class="rbw-b-days"></span>
        </div>
      </div>
    </section>

    <section class="row" id="compare">
      <h2>One attribute. Every component.</h2>
      <p class="subhead">These are real Fluid components with no per-component overrides. Switch the brand on just this panel and watch everything follow.</p>
      <div class="rbw-switcher">
        <fluid-segmented-control id="compare-brand" value="rainbow" aria-label="Brand for the panel below">
          ${COMPARE_BRANDS.map((b) => `<fluid-segment value="${b.id}">${b.label}</fluid-segment>`).join("")}
        </fluid-segmented-control>
      </div>
      <div class="rbw-sink" id="compare-panel" data-fluid-brand="rainbow">${kitchenSink("cmp")}</div>
      <pre class="motion-code"><code>import "@fluid-ds/themes/rainbow.css";

&lt;html data-fluid-brand="rainbow"&gt;  &lt;!-- or on any subtree --&gt;</code></pre>
    </section>

    <section class="row" id="widgets">
      <h2>The expansion pack</h2>
      <p class="subhead"><code>@fluid-ds/rainbow</code> adds the pieces a theme alone can't: home-screen widgets that stay accessible, localized and calm under reduced motion.</p>
      <div class="rbw-widgets">
        <fluid-card class="rbw-widget">
          <span slot="header">&lt;fluid-rainbow-landscape&gt;</span>
          <fluid-rainbow-landscape id="w-landscape">
            <fluid-rainbow-clock id="w-clock" hour-cycle="h23"></fluid-rainbow-clock>
          </fluid-rainbow-landscape>
          <div class="rbw-controls">
            <fluid-switch id="w-still">Still</fluid-switch>
            <fluid-segmented-control id="w-cycle" value="h23" aria-label="Clock hour cycle">
              <fluid-segment value="h23">24h</fluid-segment>
              <fluid-segment value="h12">12h</fluid-segment>
            </fluid-segmented-control>
            <fluid-switch id="w-date" checked>Date</fluid-switch>
          </div>
          <pre class="motion-code"><code>&lt;fluid-rainbow-landscape&gt;
  &lt;fluid-rainbow-clock&gt;&lt;/fluid-rainbow-clock&gt;
&lt;/fluid-rainbow-landscape&gt;</code></pre>
        </fluid-card>
        <fluid-card class="rbw-widget">
          <span slot="header">&lt;fluid-rainbow-battery&gt;</span>
          <div class="rbw-battery-stage">
            <fluid-rainbow-battery id="w-battery" value="72" show-value charging pulse>Storage</fluid-rainbow-battery>
          </div>
          <div class="rbw-controls">
            <fluid-slider id="w-level" value="72" aria-label="Battery level" show-value></fluid-slider>
            <fluid-switch id="w-charging" checked>Charging</fluid-switch>
            <fluid-switch id="w-pulse" checked>Heartbeat</fluid-switch>
          </div>
          <pre class="motion-code"><code id="w-battery-code"></code></pre>
        </fluid-card>
      </div>
    </section>

    <section class="row" id="illustrations">
      <h2>Illustrations</h2>
      <p class="subhead">${rainbowIllustrationNames.length} hand-drawn illustrations for the shared icon registry: app tiles in every subject, plus wide spot scenes for empty states and results. They paint from the Rainbow palette, so they follow the theme, and they fall back to their own colors anywhere else. Click one to copy its markup.</p>
      ${Object.entries(rainbowIllustrationGroups)
        .map(
          ([
            group,
            names
          ]) => `<h3 class="rbw-ill-group">${group === "spots" ? "Spot illustrations" : group.charAt(0).toUpperCase() + group.slice(1)}</h3>
      <ul class="rbw-illustrations${group === "spots" ? " rbw-illustrations-spots" : ""}">
        ${names
          .map(
            (
              n
            ) => `<li><button class="rbw-ill-tile" data-illustration="${n}" title="Copy &lt;fluid-icon name=&quot;${n}&quot;&gt;">
              <fluid-icon name="${n}"></fluid-icon><span>${n.replace("rainbow-", "")}</span>
            </button></li>`
          )
          .join("")}
      </ul>`
        )
        .join("")}
      <p class="rbw-copied" id="illustration-copied" role="status" aria-live="polite"></p>
    </section>

    <section class="row" id="tokens">
      <h2>It's all tokens</h2>
      <p class="subhead">Rainbow ships no per-component CSS. It sets tokens that every Fluid theme can use. Drag the sliders to retune this preview live, then copy the result into your own brand.</p>
      <div class="rbw-tuner">
        <div class="rbw-knobs">
          ${TOKEN_KNOBS.map(
            (k) => `<label class="rbw-knob"><span>${k.label} <code>${k.token}</code></span>
              <fluid-slider data-knob="${k.id}" min="${k.min}" max="${k.max}" value="${k.value}" aria-label="${k.label}" show-value></fluid-slider></label>`
          ).join("")}
          <pre class="motion-code"><code id="tuner-css"></code></pre>
        </div>
        <div class="rbw-tuned" id="tuned">
          <fluid-card>
            <span slot="header">Live preview</span>
            <div class="rbw-stack">
              <fluid-input label="Email" placeholder="you@example.com"></fluid-input>
              <div class="rbw-row">
                <fluid-button>Save</fluid-button>
                <fluid-button variant="secondary">Cancel</fluid-button>
              </div>
              <div class="rbw-row"><fluid-tag variant="success">Synced</fluid-tag><fluid-tag>Draft</fluid-tag><fluid-badge variant="info">New</fluid-badge></div>
              <fluid-switch checked>Auto-save</fluid-switch>
            </div>
          </fluid-card>
        </div>
      </div>
    </section>

    <section class="row" id="install">
      <h2>Install</h2>
      <p class="subhead">The theme and the pack are separate on purpose. Use the look on its own, or add the widgets and illustrations too.</p>
      <div class="rbw-steps">
        <fluid-card>
          <span slot="header">1 · The theme</span>
          <p>Pure CSS in <code>@fluid-ds/themes</code>. Put the attribute on <code>&lt;html&gt;</code> or on any section.</p>
          <pre class="motion-code"><code>pnpm add @fluid-ds/themes

import "@fluid-ds/themes/rainbow.css";
&lt;html data-fluid-brand="rainbow"&gt;</code></pre>
        </fluid-card>
        <fluid-card>
          <span slot="header">2 · The fonts</span>
          <p>The theme names Fredoka for headings and Nunito for text. Load them however you like, or it falls back to your system's rounded font.</p>
          <pre class="motion-code"><code>pnpm add @fontsource-variable/fredoka \\
         @fontsource-variable/nunito</code></pre>
        </fluid-card>
        <fluid-card>
          <span slot="header">3 · The pack (optional)</span>
          <p>Widgets and illustrations, in <code>@fluid-ds/rainbow</code>.</p>
          <pre class="motion-code"><code>pnpm add @fluid-ds/rainbow

import "@fluid-ds/rainbow/define";
import "@fluid-ds/rainbow/illustrations/register";</code></pre>
        </fluid-card>
      </div>
      <p class="rbw-docs-link"><a href="/docs/theming/brand/#what-rainbow-changes">What Rainbow changes</a> · <a href="/docs/expansion/rainbow/">Pack reference</a> · <a href="/storybook/?globals=brand:rainbow">Browse Storybook in Rainbow</a></p>
    </section>
  </main>

  <footer class="site-footer rbw-footer">
    <nav class="rbw-dock" aria-label="Sections">
      <a href="#compare" title="Compare"><fluid-icon name="rainbow-gallery" label="Compare"></fluid-icon></a>
      <a href="#widgets" title="Widgets"><fluid-icon name="rainbow-clock" label="Widgets"></fluid-icon></a>
      <a href="#illustrations" title="Illustrations"><fluid-icon name="rainbow-chat" label="Illustrations"></fluid-icon></a>
      <a href="#tokens" title="Tokens"><fluid-icon name="rainbow-gear" label="Tokens"></fluid-icon></a>
    </nav>
    <p>Rainbow is part of <a href="/">Fluid</a>, MIT licensed.</p>
  </footer>
`;

/* ── Hero buttons scroll to their section ──────────────────────────────── */
document.querySelectorAll<HTMLElement>("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(button.dataset.scroll!)?.scrollIntoView({ behavior: "smooth" });
  });
});

/* ── Dark mode ─────────────────────────────────────────────────────────── */
document.getElementById("dark-toggle")!.addEventListener("click", () => {
  const dark = root.getAttribute("data-fluid-theme") === "dark";
  root.setAttribute("data-fluid-theme", dark ? "light" : "dark");
});

/* ── Hero calendar strip: today and its neighbours ─────────────────────── */
{
  const now = new Date();
  document.getElementById("cal-month")!.textContent = now
    .toLocaleString("en", { month: "short" })
    .toUpperCase();
  document.getElementById("cal-days")!.innerHTML = [-1, 0, 1]
    .map((o) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + o).getDate();
      return `<span class="${o === 0 ? "is-today" : ""}">${d}</span>`;
    })
    .join("");
}

/* ── Live comparison ───────────────────────────────────────────────────── */
const panel = document.getElementById("compare-panel")!;
document.getElementById("compare-brand")!.addEventListener("fluid-change", (e) => {
  const brand = (e as CustomEvent<{ value: string }>).detail.value;
  panel.setAttribute("data-fluid-brand", brand === "default" ? "" : brand);
});

/* ── Widget controls ───────────────────────────────────────────────────── */
const landscape = document.getElementById("w-landscape")!;
const clock = document.getElementById("w-clock")!;
const battery = document.getElementById("w-battery") as FluidRainbowBattery;
const onToggle = (id: string, fn: (on: boolean) => void) =>
  document
    .getElementById(id)!
    .addEventListener("fluid-change", (e) =>
      fn((e as CustomEvent<{ checked: boolean }>).detail.checked)
    );

onToggle("w-still", (on) => landscape.toggleAttribute("still", on));
onToggle("w-date", (on) => clock.toggleAttribute("hide-date", !on));
document.getElementById("w-cycle")!.addEventListener("fluid-change", (e) => {
  clock.setAttribute("hour-cycle", (e as CustomEvent<{ value: string }>).detail.value);
});

const batteryCode = document.getElementById("w-battery-code")!;
const renderBatteryCode = () => {
  const attrs = [
    `value="${battery.value}"`,
    "show-value",
    battery.charging ? "charging" : "",
    battery.pulse ? "pulse" : ""
  ]
    .filter(Boolean)
    .join(" ");
  batteryCode.textContent = `<fluid-rainbow-battery ${attrs}>\n  Storage\n</fluid-rainbow-battery>`;
};
document.getElementById("w-level")!.addEventListener("fluid-input", (e) => {
  battery.value = Number((e as CustomEvent<{ value: string }>).detail.value);
  renderBatteryCode();
});
onToggle("w-charging", (on) => {
  battery.charging = on;
  renderBatteryCode();
});
onToggle("w-pulse", (on) => {
  battery.pulse = on;
  renderBatteryCode();
});
renderBatteryCode();

/* ── Illustration gallery: click to copy ───────────────────────────────── */
const copied = document.getElementById("illustration-copied")!;
document.querySelectorAll<HTMLButtonElement>(".rbw-ill-tile").forEach((tile) => {
  tile.addEventListener("click", async () => {
    const markup = `<fluid-icon name="${tile.dataset.illustration}"></fluid-icon>`;
    try {
      await navigator.clipboard.writeText(markup);
      copied.textContent = `Copied ${markup}`;
    } catch {
      copied.textContent = markup;
    }
  });
});

/* ── Token tuner ───────────────────────────────────────────────────────── */
const tuned = document.getElementById("tuned")!;
const tunerCss = document.getElementById("tuner-css")!;
const values: Record<string, number> & Record<(typeof TOKEN_KNOBS)[number]["id"], number> =
  Object.fromEntries(TOKEN_KNOBS.map((k) => [k.id, k.value as number])) as Record<
    (typeof TOKEN_KNOBS)[number]["id"],
    number
  >;
const applyTokens = () => {
  const decls: Array<[string, string]> = [
    ["--fluid-border-width-default", `${values.border}px`],
    ["--fluid-field-border-width", `${values.border}px`],
    ["--fluid-button-border-width", `${values.border}px`],
    ["--fluid-border-width-divider", `${values.divider}px`],
    // One slider drives the whole ramp, so tags (sm), fields (md) and cards
    // (lg) stay in proportion.
    ["--fluid-radius-sm", `${Math.round(values.radius * 0.3)}px`],
    ["--fluid-radius-md", `${Math.round(values.radius * 0.47)}px`],
    ["--fluid-radius-lg", `${values.radius}px`],
    ["--fluid-radius-xl", `${Math.round(values.radius * 1.18)}px`],
    ["--fluid-field-border-radius", `${Math.round(values.radius * 0.47)}px`],
    ["--fluid-shadow-md", `0 ${values.pop}px 0 var(--rainbow-pop)`],
    ["--fluid-button-shadow", `0 ${values.pop}px 0 var(--rainbow-pop)`],
    ["--fluid-button-hover-shadow", `0 ${values.pop + 2}px 0 var(--rainbow-pop)`],
    ["--fluid-card-shadow-md", `0 0 0 ${values.border}px var(--rainbow-line)`]
  ];
  for (const [prop, value] of decls) tuned.style.setProperty(prop, value);
  tunerCss.textContent = `[data-fluid-brand="my-brand"] {\n${decls.map(([p, v]) => `  ${p}: ${v};`).join("\n")}\n}`;
};
document.querySelectorAll<HTMLElement>("[data-knob]").forEach((slider) => {
  slider.addEventListener("fluid-input", (e) => {
    values[slider.dataset.knob!] = Number((e as CustomEvent<{ value: string }>).detail.value);
    applyTokens();
  });
});
applyTokens();
