/**
 * `<fluid-celebrate>`: a declarative wrapper around the imperative effects
 * API. It renders as a zero-size transparent inline anchor; the effect paints
 * on the shared overlay canvas owned by the engine.
 *
 * To keep `@fluid-ds/animations` a zero-dependency package this extends the
 * platform `HTMLElement` rather than `LitElement` / `FluidElement`.
 *
 * ```html
 * <!-- fires on connect -->
 * <fluid-celebrate effect="confetti" auto></fluid-celebrate>
 *
 * <!-- fire imperatively -->
 * <fluid-celebrate id="party" effect="fireworks"></fluid-celebrate>
 * <script>document.getElementById("party").fire();</script>
 * ```
 *
 * Attributes / properties:
 *   - `effect`     one of the preset names (default `confetti`)
 *   - `auto`       boolean: fire once on connect
 *   - numeric tuning attributes such as `count`, `size`, `duration`,
 *                  `velocity`, `gravity`, `spread`, `rate`, and effect-specific
 *                  controls (`shells`, `interval`, `particles-per-shell`,
 *                  `rings`, `radius`)
 *   - `colors`     space- or comma-separated color list, OR set the
 *                  `.colors` JS property to an array
 *   - `origin`     `"self"`, `"x,y"`, `"rx,ry"`, or a named edge/corner preset
 *   - `cannons`    legacy boolean alias for bottom-corner confetti
 *   - `originTarget` JS-only Element override used by `origin="self"`
 *
 * Emits `fluid-celebrate-end` (bubbles, composed) when the burst finishes.
 */

import {
  EFFECTS,
  EFFECT_ORIGIN_PRESETS,
  type EffectHandle,
  type EffectName,
  type EffectOriginPreset,
  type Origin
} from "./index.js";

const EFFECT_ALIASES: Readonly<Record<string, EffectName>> = {
  "emoji-burst": "emojiBurst",
  "emoji-rain": "emojiRain",
  "emoji-fountain": "emojiFountain",
  "shooting-stars": "shootingStars",
  "magic-trail": "magicTrail",
  "dust-motes": "dustMotes",
  "shockwave-debris": "shockwaveDebris",
  "firework-finale": "fireworkFinale",
  "success-check": "successCheck"
};

// Lit's server shim intentionally does not install a global HTMLElement. The
// fallback keeps this transparent, zero-dependency controller importable in a
// server process; browsers always use the native constructor.
const HTMLElementBase = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

export class FluidCelebrate extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return [
      "effect",
      "auto",
      "emojis",
      "colors",
      "count",
      "origin",
      "cannons",
      "shells",
      "rate",
      "duration",
      "spread",
      "velocity",
      "gravity",
      "size",
      "angle",
      "interval",
      "particles-per-shell",
      "rings",
      "radius"
    ];
  }

  /** Color override, settable as a JS property (array) or `colors` attr. */
  colors?: string[];

  /** Optional element used by `origin="self"`. Useful when the transparent
   * controller sits next to, rather than around, the element being celebrated. */
  originTarget?: Element;

  /** Emoji glyph override (array), settable as a property or the `emojis` attr. */
  #emojis?: string[];
  #handle: EffectHandle | undefined;
  #refireQueued = false;

  /**
   * Emoji glyphs the emoji presets cycle through, picked at random per
   * particle. Settable as a property (array) or the space/comma-separated
   * `emojis` attribute. Updating it while `auto` is set re-fires the effect.
   */
  get emojis(): string[] | undefined {
    return this.#emojis ?? this.#parseList(this.getAttribute("emojis"));
  }
  set emojis(value: string[] | undefined) {
    this.#emojis = value;
    this.#maybeRefire();
  }

  connectedCallback(): void {
    // A zero-size inline box remains visually transparent but has a meaningful
    // viewport position. `display: contents` produced a permanent 0,0 rect,
    // which made `origin="self"` fire from the top-left corner.
    this.style.display = this.style.display || "inline-block";
    this.style.inlineSize = this.style.inlineSize || "0";
    this.style.blockSize = this.style.blockSize || "0";
    this.style.pointerEvents = this.style.pointerEvents || "none";
    if (this.hasAttribute("auto")) {
      // Defer so layout has settled and any `origin="self"` rect is real.
      requestAnimationFrame(() => {
        if (this.isConnected) void this.fire();
      });
    }
  }

  disconnectedCallback(): void {
    this.stop();
  }

  attributeChangedCallback(): void {
    // Options are read lazily on fire(), so nothing to sync here. But if the
    // element is live and set to auto-play, reflect the change by re-firing so
    // a dynamically-updated emoji set (or effect) is shown immediately.
    this.#maybeRefire();
  }

  /**
   * When `auto` is set and the element is connected, re-run the effect on the
   * next frame after a config change. Coalesced so flipping several attributes
   * at once fires only once.
   */
  #maybeRefire(): void {
    if (this.#refireQueued || !this.isConnected || !this.hasAttribute("auto")) return;
    this.#refireQueued = true;
    requestAnimationFrame(() => {
      this.#refireQueued = false;
      if (this.isConnected && this.hasAttribute("auto")) void this.fire();
    });
  }

  #parseList(raw: string | null): string[] | undefined {
    if (!raw) return undefined;
    const list = raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return list.length ? list : undefined;
  }

  /** The configured effect name. */
  get effect(): string {
    return this.getAttribute("effect") ?? "confetti";
  }
  set effect(value: string) {
    this.setAttribute("effect", value);
  }

  /**
   * Fire the configured effect once. Resolves when the burst ends, having
   * dispatched `fluid-celebrate-end`, unless the element was disconnected
   * mid-burst (e.g. via `stop()` from `disconnectedCallback`), in which case
   * the end event is suppressed because it could not reach delegated listeners.
   */
  async fire(): Promise<void> {
    const alias = EFFECT_ALIASES[this.effect];
    const name = alias ?? this.effect;
    const fn = Object.prototype.hasOwnProperty.call(EFFECTS, name)
      ? EFFECTS[name as EffectName]
      : EFFECTS.confetti;
    const opts = this.#readOptions();
    this.stop();
    const handle = fn(opts);
    this.#handle = handle;
    await handle.finished;
    // A later fire() or stop() superseded this run. Its promise resolves when
    // canceled, but it must not announce a successful completion.
    if (this.#handle !== handle) return;
    this.#handle = undefined;
    // If the element was removed mid-burst (disconnectedCallback -> stop()
    // resolves handle.finished), don't dispatch on a detached node: the event
    // wouldn't bubble to the document and delegated listeners would miss it.
    if (!this.isConnected) return;
    this.dispatchEvent(new CustomEvent("fluid-celebrate-end", { bubbles: true, composed: true }));
  }

  /** Stop the current effect, if any. */
  stop(): void {
    this.#handle?.stop();
    this.#handle = undefined;
  }

  #readOptions(): Record<string, unknown> {
    const opts: Record<string, unknown> = {};

    const colors = this.colors ?? this.#parseColors(this.getAttribute("colors"));
    if (colors && colors.length) opts["colors"] = colors;
    if (this.emojis && this.emojis.length) opts["emojis"] = this.emojis;

    const count = this.#num("count");
    if (count !== undefined) opts["count"] = count;
    const shells = this.#num("shells");
    if (shells !== undefined) opts["shells"] = shells;
    const rate = this.#num("rate");
    if (rate !== undefined) opts["rate"] = rate;
    const duration = this.#num("duration");
    if (duration !== undefined) opts["duration"] = duration;
    const spread = this.#num("spread");
    if (spread !== undefined) opts["spread"] = spread;
    const velocity = this.#num("velocity");
    if (velocity !== undefined) opts["velocity"] = velocity;
    const gravity = this.#num("gravity");
    if (gravity !== undefined) opts["gravity"] = gravity;
    const size = this.#num("size");
    if (size !== undefined) opts["size"] = size;
    const angle = this.#num("angle");
    if (angle !== undefined) opts["angle"] = angle;
    const interval = this.#num("interval");
    if (interval !== undefined) opts["interval"] = interval;
    const particlesPerShell = this.#num("particles-per-shell");
    if (particlesPerShell !== undefined) opts["particlesPerShell"] = particlesPerShell;
    const rings = this.#num("rings");
    if (rings !== undefined) opts["rings"] = rings;
    const radius = this.#num("radius");
    if (radius !== undefined) opts["radius"] = radius;

    if (this.hasAttribute("cannons")) opts["cannons"] = true;

    const originRaw = this.getAttribute("origin");
    if (originRaw && Object.prototype.hasOwnProperty.call(EFFECT_ORIGIN_PRESETS, originRaw)) {
      const sources = EFFECT_ORIGIN_PRESETS[originRaw as EffectOriginPreset];
      opts["sources"] = sources;
      if (sources[0]) opts["origin"] = sources[0].origin;
    } else {
      const origin = this.#readOrigin();
      if (origin !== undefined) opts["origin"] = origin;
    }

    return opts;
  }

  #readOrigin(): Origin | undefined {
    const raw = this.getAttribute("origin");
    if (raw === null) return undefined;
    if (raw === "self") return this.originTarget ?? this;
    const parts = raw.split(",").map((s) => Number(s.trim()));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      const [a, b] = parts as [number, number];
      // Values in [0, 1] on both axes are treated as relative.
      if (a >= 0 && a <= 1 && b >= 0 && b <= 1) return { rx: a, ry: b };
      return { x: a, y: b };
    }
    return undefined;
  }

  #parseColors(raw: string | null): string[] | undefined {
    if (!raw) return undefined;
    const list: string[] = [];
    let token = "";
    let depth = 0;
    for (const char of raw.trim()) {
      if (char === "(") depth += 1;
      else if (char === ")") depth = Math.max(0, depth - 1);
      if ((char === "," || /\s/.test(char)) && depth === 0) {
        if (token.trim()) list.push(token.trim());
        token = "";
      } else {
        token += char;
      }
    }
    if (token.trim()) list.push(token.trim());
    return list.length ? list : undefined;
  }

  #num(attr: string): number | undefined {
    const raw = this.getAttribute(attr);
    if (raw === null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
}
