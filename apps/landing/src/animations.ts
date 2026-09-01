/**
 * Standalone marketing + demo page for @fluid-ds/animations, served at
 * /animations.html. Shareable on its own: it showcases the whole animation
 * system (attribute-driven keyframes, the imperative effects engine, and the
 * declarative <fluid-celebrate> element) without depending on the rest of the
 * landing page. It registers only the handful of components it uses, to keep
 * the "lean, standalone" story honest.
 */
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";
import "@fluid-ds/icons/register-defaults";
import "@fluid-ds/icons/lucide/github";
import "@fluid-ds/icons/lucide/sparkles";
import "@fluid-ds/icons/lucide/sun-moon";
// Brand presets, so the page (and the effect colors, which read the live brand
// ramp) can be reskinned from the header, the same way a consuming app would.
import "@fluid-ds/themes/titanium.css";
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/card";
import "@fluid-ds/components/define/icon";
import "@fluid-ds/components/define/slider";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/animations/define/controller";
import "@fluid-ds/animations/register-defaults";
import "@fluid-ds/animations/define/celebrate";
import {
  getAnimation,
  listAnimations,
  playElementAnimation,
  type FluidCelebrate
} from "@fluid-ds/animations";
import {
  confetti,
  brandColors,
  EFFECTS,
  EFFECT_CATALOG,
  EFFECT_ORIGIN_PRESETS,
  type EffectCatalogEntry,
  type EffectName,
  type EffectOriginPreset,
  type Origin
} from "@fluid-ds/animations/effects";
import "./styles.css";

const VISIBLE_EFFECTS: readonly EffectCatalogEntry[] = EFFECT_CATALOG.filter(
  (effect: EffectCatalogEntry) => !effect.hidden
);

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

const ANIMS = listAnimations();

const EFFECT_DEMO_OPTIONS: Partial<Record<EffectName, Record<string, unknown>>> = {
  emojiBurst: { emojis: ["🥳", "🎈", "🎁", "🍾"] },
  emojiRain: { emojis: ["🎉", "⭐", "✨", "💧"] },
  emojiFountain: { emojis: ["🎉", "✨", "⭐", "🎈"] }
};

document.body.innerHTML = `
  <header class="site-nav">
    <a class="brand" href="/">${LOGO}<span>Fluid</span></a>
    <nav class="primary" aria-label="Primary">
      <a href="/">Home</a>
      <a href="/docs/">Docs</a>
      <fluid-select id="brand-picker" value="default" aria-label="Brand theme" class="anim-brand-picker">
        <fluid-option value="default">Default</fluid-option>
        <fluid-option value="titanium">Titanium</fluid-option>
        <fluid-option value="midnight">Midnight</fluid-option>
        <fluid-option value="corporate">Corporate</fluid-option>
      </fluid-select>
      <fluid-button id="dark-toggle" variant="ghost" size="sm" aria-label="Toggle dark mode">
        <fluid-icon name="sun-moon"></fluid-icon>
      </fluid-button>
      <a class="cta landing-button secondary compact" href="${GH}" target="_blank" rel="noopener" aria-label="GitHub repository">
        <fluid-icon name="github"></fluid-icon>
        GitHub
      </a>
    </nav>
  </header>

  <section class="anim-hero">
    <span class="motion-eyebrow">✨ @fluid-ds/animations</span>
    <h1 class="anim-hero-title">Motion, as a standalone package</h1>
    <p class="anim-hero-lead">A framework-agnostic animation system in one small package. A global controller runs keyframes from a <code>data-fluid-animation</code> attribute on any element, and an imperative effects engine fires canvas effects with purpose-tuned palettes, or your live brand colors with one option. No other Fluid component required, and every effect honors <code>prefers-reduced-motion</code>.</p>
    <div class="anim-hero-cta">
      <fluid-button id="hero-celebrate" size="lg"><fluid-icon slot="prefix" name="sparkles"></fluid-icon>Celebrate</fluid-button>
      <code class="anim-install">npm i @fluid-ds/animations</code>
    </div>
  </section>

  <section class="row">
    <h2>Effects engine</h2>
    <p class="subhead">Canvas effects with zero third-party dependencies, tuned live. Pick an effect to reveal the settings it actually supports; ambient effects stop spawning after their duration and fizzle out naturally.</p>
    <div class="anim-effects" role="list" aria-label="Effects">
      ${VISIBLE_EFFECTS.map(
        (effect, index) =>
          `<button class="anim-tile" role="listitem" data-effect="${effect.name}" aria-pressed="${index === 0 ? "true" : "false"}"><span class="anim-tile-emoji" aria-hidden="true">${effect.emoji}</span><span class="anim-tile-label">${effect.label}</span><span class="anim-tile-kind">${effect.kind}</span></button>`
      ).join("")}
    </div>
    <div class="anim-controls" role="group" aria-label="Effect settings">
      <div class="anim-control-heading">
        <strong id="effect-title">Confetti</strong>
        <span id="effect-kind">burst</span>
        <span id="effect-description" class="anim-effect-description">Colorful paper burst</span>
      </div>
      <div id="effect-control-fields" class="anim-control-fields"></div>
      <label class="anim-control" id="origin-control">
        <span class="anim-control-label">Origin</span>
        <fluid-select id="ctl-origin" value="click" aria-label="Origin">
          <fluid-option value="click">Selected tile</fluid-option>
          <fluid-option value="center">Center</fluid-option>
          <fluid-option value="top">Top edge</fluid-option>
          <fluid-option value="bottom">Bottom edge</fluid-option>
          <fluid-option value="left">Left edge</fluid-option>
          <fluid-option value="right">Right edge</fluid-option>
          <fluid-option value="top-left">Top left</fluid-option>
          <fluid-option value="top-right">Top right</fluid-option>
          <fluid-option value="bottom-left">Bottom left</fluid-option>
          <fluid-option value="bottom-right">Bottom right</fluid-option>
          <fluid-option value="top-corners" data-multi-origin>Both top corners</fluid-option>
          <fluid-option value="bottom-corners" data-multi-origin>Both bottom corners</fluid-option>
          <fluid-option value="all-corners" data-multi-origin>All corners</fluid-option>
        </fluid-select>
      </label>
      <label class="anim-control anim-control--switch">
        <span class="anim-control-label">Brand colors</span>
        <span class="anim-switch-slot"
          ><fluid-switch id="ctl-brand" aria-label="Tint effects to the active brand"></fluid-switch
        ></span>
      </label>
      <label class="anim-control anim-control--switch">
        <span class="anim-control-label">Document space</span>
        <span class="anim-switch-slot"
          ><fluid-switch id="ctl-document-space" aria-label="Anchor particles to the full document"></fluid-switch
        ></span>
      </label>
      <fluid-button id="effect-fire"><fluid-icon slot="prefix" name="sparkles"></fluid-icon>Play Confetti</fluid-button>
    </div>
    <pre class="motion-code"><code id="effect-code">import { confetti } from "@fluid-ds/animations/effects";

confetti(); // colorful paper burst
confetti({ count: 200, velocity: 1200, gravity: 700, size: 8, origin: el });</code></pre>
    <div class="anim-origin-demo">
      <span>Origin can be any element, so a button can throw its own little burst:</span>
      <fluid-button id="confetti-btn" variant="secondary" size="sm"><fluid-icon slot="prefix" name="sparkles"></fluid-icon>Throw confetti</fluid-button>
    </div>
  </section>

  <section class="row">
    <h2>Attribute-driven keyframes</h2>
    <p class="subhead">Add one attribute to any element and the controller runs the keyframe through the Web Animations API. Triggers: mount, in-view, hover, click, or manual. Pick one to preview it on the card.</p>
    <div class="anim-stage">
      <div
        class="anim-preview"
        id="anim-preview"
        data-fluid-animation-trigger="manual"
      >
        <span class="anim-preview-emoji" aria-hidden="true">✦</span>
        <strong>Fluid</strong>
      </div>
    </div>
    <div class="anim-preview-toolbar">
      <span id="anim-timing" class="anim-preview-timing"></span>
      <fluid-button id="anim-replay" variant="secondary" size="sm">Replay</fluid-button>
    </div>
    <div class="anim-chips">
      ${ANIMS.map((name) => `<button class="anim-chip" data-anim="${name}">${name}</button>`).join("")}
    </div>
    <pre class="motion-code"><code>&lt;script type="module" src="@fluid-ds/animations/define/controller"&gt;&lt;/script&gt;
&lt;script type="module" src="@fluid-ds/animations/register-defaults"&gt;&lt;/script&gt;

&lt;div data-fluid-animation="slide-up" data-fluid-animation-trigger="in-view"&gt;
  Animates when it scrolls into view.
&lt;/div&gt;</code></pre>
  </section>

  <section class="row">
    <h2>Declarative &lt;fluid-celebrate&gt;</h2>
    <p class="subhead">Prefer markup? The <code>&lt;fluid-celebrate&gt;</code> element wraps the effects API. Give it an <code>effect</code>, fire it with <code>auto</code> or a method call, and it emits <code>fluid-celebrate-end</code>.</p>
    <fluid-celebrate id="celebrate-demo" effect="fireworks"></fluid-celebrate>
    <div class="anim-hero-cta">
      <fluid-button id="celebrate-fire" variant="secondary">🎆 Fire &lt;fluid-celebrate&gt;</fluid-button>
    </div>
    <pre class="motion-code"><code>&lt;fluid-celebrate effect="confetti" auto&gt;&lt;/fluid-celebrate&gt;

&lt;!-- or imperatively --&gt;
document.querySelector("fluid-celebrate").fire();</code></pre>
  </section>

  <section class="row">
    <h2>Standalone, in any stack</h2>
    <p class="subhead">It ships as its own <code>@fluid-ds/*</code> package with side-effect-free imports. Load it from a CDN with two script tags, or install and import only what you use.</p>
    <div class="anim-install-grid">
      <fluid-card variant="outline">
        <h3 slot="header" class="card-h">CDN, no build</h3>
        <pre class="motion-code"><code>&lt;script type="module"
  src="…/@fluid-ds/animations/dist/define/controller.js"&gt;&lt;/script&gt;
&lt;script type="module"
  src="…/@fluid-ds/animations/dist/register-defaults.js"&gt;&lt;/script&gt;</code></pre>
      </fluid-card>
      <fluid-card variant="outline">
        <h3 slot="header" class="card-h">npm, tree-shaken</h3>
        <pre class="motion-code"><code>import "@fluid-ds/animations/define/controller";
import "@fluid-ds/animations/animations/fade-in";
import { confetti } from "@fluid-ds/animations/effects";</code></pre>
      </fluid-card>
    </div>
    <p class="anim-foot-note">Works on <code>fluid-*</code> components, plain HTML, and elements rendered by React, Vue, Angular, Svelte, or Solid, the same attributes and the same calls everywhere.</p>
  </section>

  <footer class="anim-footer">
    <a class="brand" href="/">${LOGO}<span>Fluid</span></a>
    <p class="anim-footer-links"><a href="/">Back to Fluid</a> · <a href="/docs/">Docs</a> · <a href="${GH}" target="_blank" rel="noopener">GitHub</a></p>
    <p class="anim-footer-fine">MIT licensed. Motion stands down under reduced-motion.</p>
  </footer>
`;
// Paint the page from tokens so the dark toggle actually reskins it.
document.body.classList.add("anim-page");

/* ---- Handlers ---- */
/** Read a fluid-slider's numeric value. */
function sliderVal(id: string, fallback: number): number {
  const el = document.getElementById(id) as (HTMLElement & { value?: number | string }) | null;
  const v = el ? Number(el.value) : NaN;
  return Number.isFinite(v) ? v : fallback;
}
/** Resolve the chosen origin: "click" uses the clicked tile, the rest are
 *  relative viewport points. */
const MULTI_ORIGIN_PRESETS = new Set<EffectOriginPreset>([
  "top-corners",
  "bottom-corners",
  "all-corners"
]);

function chosenOriginPreset(): EffectOriginPreset | undefined {
  const sel = document.getElementById("ctl-origin") as (HTMLElement & { value?: string }) | null;
  const value = sel?.value;
  if (!value || value === "click" || !(value in EFFECT_ORIGIN_PRESETS)) return undefined;
  return value as EffectOriginPreset;
}

function chosenOrigin(clicked: Element): Origin {
  const preset = chosenOriginPreset();
  return preset ? (EFFECT_ORIGIN_PRESETS[preset][0]?.origin ?? clicked) : clicked;
}
/** The opt-in palette: brand ramp when the "Brand colors" switch is on, else
 *  undefined so the effect uses its purpose-tuned default. */
function effectColors(): readonly string[] | undefined {
  const sw = document.getElementById("ctl-brand") as (HTMLElement & { checked?: boolean }) | null;
  return sw?.checked ? brandColors() : undefined;
}

/** Opt into page-anchored coordinates. Omitted means the backwards-compatible
 * viewport default. */
function effectSpace(): "document" | undefined {
  const sw = document.getElementById("ctl-document-space") as
    | (HTMLElement & { checked?: boolean })
    | null;
  return sw?.checked ? "document" : undefined;
}

let selectedEffect: EffectCatalogEntry = VISIBLE_EFFECTS[0]!;

function updateEffectCode(): void {
  const code = document.getElementById("effect-code");
  if (!code) return;
  const branded = Boolean(effectColors());
  const options = selectedEffect.controls.map(
    (setting) => `${setting.key}: ${sliderVal(`ctl-${setting.key}`, setting.value)}`
  );
  if (effectSpace()) options.push('space: "document"');
  if (selectedEffect.origin) {
    const preset = chosenOriginPreset();
    if (preset && selectedEffect.multiOrigin) {
      options.push(`sources: EFFECT_ORIGIN_PRESETS["${preset}"]`);
    } else if (preset) {
      const origin = EFFECT_ORIGIN_PRESETS[preset][0]?.origin;
      options.push(`origin: ${JSON.stringify(origin)}`);
    } else {
      options.push("origin: el");
    }
  }
  if (branded) options.push("colors: brandColors()");
  const imports: string[] = [selectedEffect.name];
  if (branded) imports.push("brandColors");
  if (selectedEffect.multiOrigin && chosenOriginPreset()) imports.push("EFFECT_ORIGIN_PRESETS");
  const description = `${selectedEffect.description.charAt(0).toLowerCase()}${selectedEffect.description.slice(1)}`;
  code.textContent = `import { ${imports.join(", ")} } from "@fluid-ds/animations/effects";

${selectedEffect.name}(); // ${description}
${selectedEffect.name}({ ${options.join(", ")} });`;
}

function renderEffectControls(effect: EffectCatalogEntry): void {
  selectedEffect = effect;
  document.querySelectorAll<HTMLElement>("[data-effect]").forEach((tile) => {
    tile.setAttribute("aria-pressed", String(tile.dataset.effect === effect.name));
  });
  const title = document.getElementById("effect-title");
  const kind = document.getElementById("effect-kind");
  const description = document.getElementById("effect-description");
  if (title) title.textContent = effect.label;
  if (kind) kind.textContent = effect.kind;
  if (description) description.textContent = effect.description;
  const originControl = document.getElementById("origin-control");
  if (originControl) originControl.hidden = !effect.origin;
  const originSelect = document.getElementById("ctl-origin") as
    | (HTMLElement & { value?: string })
    | null;
  document.querySelectorAll<HTMLElement>("[data-multi-origin]").forEach((option) => {
    option.hidden = !effect.multiOrigin;
  });
  if (!effect.multiOrigin && MULTI_ORIGIN_PRESETS.has(originSelect?.value as EffectOriginPreset)) {
    if (originSelect) originSelect.value = "click";
  }
  const fire = document.getElementById("effect-fire");
  if (fire)
    fire.innerHTML = `<fluid-icon slot="prefix" name="sparkles"></fluid-icon>Play ${effect.label}`;

  const fields = document.getElementById("effect-control-fields");
  if (!fields) return;
  fields.innerHTML = effect.controls
    .map(
      (setting) => `<label class="anim-control">
        <span class="anim-control-label">${setting.label} <b id="ctl-${setting.key}-val">${setting.value}</b></span>
        <fluid-slider id="ctl-${setting.key}" min="${setting.min}" max="${setting.max}" step="${setting.step}" value="${setting.value}" aria-label="${setting.label}"></fluid-slider>
      </label>`
    )
    .join("");
  for (const setting of effect.controls) {
    const slider = document.getElementById(`ctl-${setting.key}`);
    const output = document.getElementById(`ctl-${setting.key}-val`);
    slider?.addEventListener("fluid-input", () => {
      if (output) output.textContent = String(sliderVal(`ctl-${setting.key}`, setting.value));
      updateEffectCode();
    });
  }
  updateEffectCode();
}

function playEffect(effect: EffectCatalogEntry, originElement: Element): void {
  const options: Record<string, unknown> = { ...EFFECT_DEMO_OPTIONS[effect.name as EffectName] };
  for (const setting of effect.controls) {
    options[setting.key] = sliderVal(`ctl-${setting.key}`, setting.value);
  }
  if (effect.origin) {
    const preset = chosenOriginPreset();
    if (effect.multiOrigin && preset) options["sources"] = EFFECT_ORIGIN_PRESETS[preset];
    else options["origin"] = chosenOrigin(originElement);
  }
  const colors = effectColors();
  if (colors) options["colors"] = colors;
  const space = effectSpace();
  if (space) options["space"] = space;
  EFFECTS[effect.name as EffectName](options);
}

document.querySelectorAll<HTMLElement>("[data-effect]").forEach((tile) => {
  tile.addEventListener("click", () => {
    const effect = VISIBLE_EFFECTS.find((item) => item.name === tile.dataset.effect);
    if (!effect) return;
    renderEffectControls(effect);
    playEffect(effect, tile);
  });
});
document.getElementById("effect-fire")?.addEventListener("click", () => {
  const tile = document.querySelector<HTMLElement>(`[data-effect="${selectedEffect.name}"]`);
  playEffect(selectedEffect, tile ?? document.body);
});
document.getElementById("ctl-origin")?.addEventListener("fluid-change", updateEffectCode);
document.getElementById("ctl-brand")?.addEventListener("fluid-change", updateEffectCode);
document.getElementById("ctl-document-space")?.addEventListener("fluid-change", updateEffectCode);
renderEffectControls(selectedEffect);

// A document-wide ambient welcome on first load. It remains decorative,
// honors reduced motion, and winds itself down automatically.
EFFECTS.butterflies({ space: "document", rate: 5.25, size: 13, duration: 6_000 });

// Attribute-driven preview: show every registered preset with its real default
// timing. A replay button keeps one-shot entrance animations easy to inspect.
const animPreview = document.getElementById("anim-preview");
let previewAnim: Animation | undefined;
let selectedAnimationName = ANIMS[0] ?? "fade-in";
function selectPreviewAnimation(name: string, chip: Element): void {
  document.querySelectorAll(".anim-chip").forEach((c) => c.removeAttribute("aria-pressed"));
  chip.setAttribute("aria-pressed", "true");
  if (!animPreview) return;
  selectedAnimationName = name;
  previewAnim?.cancel();
  animPreview.setAttribute("data-fluid-animation", name);
  const anim = playElementAnimation(animPreview);
  previewAnim = anim;
  const definition = getAnimation(name);
  const timing = document.getElementById("anim-timing");
  if (timing && definition) {
    const duration = String(definition.defaults.duration ?? "auto");
    timing.textContent = `${duration}ms · ${definition.defaults.easing ?? "linear"} · ${definition.defaults.iterations ?? 1} iteration${definition.defaults.iterations === 1 || definition.defaults.iterations === undefined ? "" : "s"}`;
  }
}
document.querySelectorAll<HTMLElement>("[data-anim]").forEach((chip) => {
  chip.addEventListener("click", () => selectPreviewAnimation(chip.dataset.anim ?? "", chip));
});
// Start with the first chip so the card is already alive on load.
const firstChip = document.querySelector<HTMLElement>(".anim-chip");
if (firstChip) selectPreviewAnimation(firstChip.dataset.anim ?? "fade-in", firstChip);
document.getElementById("anim-replay")?.addEventListener("click", () => {
  const chip = document.querySelector<HTMLElement>(`[data-anim="${selectedAnimationName}"]`);
  if (chip) selectPreviewAnimation(selectedAnimationName, chip);
});

// Origin can be a real element: this button throws a small burst from itself.
document.getElementById("confetti-btn")?.addEventListener("click", (e) => {
  confetti({ origin: e.currentTarget as Element, count: 45, velocity: 650, size: 6, spread: 55 });
});

document
  .getElementById("hero-celebrate")
  ?.addEventListener("click", () => confetti({ sources: EFFECT_ORIGIN_PRESETS["bottom-corners"] }));
document.getElementById("celebrate-fire")?.addEventListener("click", () => {
  (document.getElementById("celebrate-demo") as FluidCelebrate | null)?.fire();
});

// Header theme controls. Reskinning the document (brand + light/dark on <html>)
// also reskins the effects, since each burst reads the live brand ramp at draw
// time. These are exactly the attributes a consuming app sets.
document.getElementById("brand-picker")?.addEventListener("fluid-change", (e) => {
  const value = String((e as CustomEvent).detail?.value ?? "default");
  if (value === "default") document.documentElement.removeAttribute("data-fluid-brand");
  else document.documentElement.setAttribute("data-fluid-brand", value);
});
document.getElementById("dark-toggle")?.addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.getAttribute("data-fluid-theme") === "dark";
  root.setAttribute("data-fluid-theme", dark ? "light" : "dark");
});
