/**
 * `<fluid-celebrate>`: a declarative wrapper around the imperative effects
 * API. It renders nothing visible itself (`display: contents`); the effect
 * paints on the shared overlay canvas owned by the engine.
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
 *   - `count`      number, forwarded to the preset
 *   - `colors`     space- or comma-separated color list, OR set the
 *                  `.colors` JS property to an array
 *   - `origin`     `"self"` (this element), `"x,y"`, or `"rx,ry"` relative
 *   - `cannons`    boolean (confetti / pride)
 *
 * Emits `fluid-celebrate-end` (bubbles, composed) when the burst finishes.
 */

import {
  confetti,
  fireworks,
  emojiBurst,
  emojiRain,
  emojiFountain,
  bubbles,
  snow,
  sparkles,
  streamers,
  pulse,
  stars,
  hearts,
  pride,
  type EffectHandle,
  type Origin
} from "./index.js";

type EffectFn = (opts: Record<string, unknown>) => EffectHandle;

const PRESETS: Record<string, EffectFn> = {
  confetti: confetti as EffectFn,
  fireworks: fireworks as EffectFn,
  emojiBurst: emojiBurst as EffectFn,
  "emoji-burst": emojiBurst as EffectFn,
  emojiRain: emojiRain as EffectFn,
  "emoji-rain": emojiRain as EffectFn,
  emojiFountain: emojiFountain as EffectFn,
  "emoji-fountain": emojiFountain as EffectFn,
  bubbles: bubbles as EffectFn,
  snow: snow as EffectFn,
  sparkles: sparkles as EffectFn,
  streamers: streamers as EffectFn,
  pulse: pulse as EffectFn,
  stars: stars as EffectFn,
  hearts: hearts as EffectFn,
  pride: pride as EffectFn
};

export class FluidCelebrate extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["effect", "auto", "emojis", "colors", "count"];
  }

  /** Color override, settable as a JS property (array) or `colors` attr. */
  colors?: string[];

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
    this.style.display = this.style.display || "contents";
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
   * dispatched `fluid-celebrate-end`.
   */
  async fire(): Promise<void> {
    const fn = PRESETS[this.effect] ?? confetti;
    const opts = this.#readOptions();
    this.stop();
    const handle = fn(opts);
    this.#handle = handle;
    await handle.finished;
    if (this.#handle === handle) this.#handle = undefined;
    this.dispatchEvent(
      new CustomEvent("fluid-celebrate-end", { bubbles: true, composed: true })
    );
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

    if (this.hasAttribute("cannons")) opts["cannons"] = true;

    const origin = this.#readOrigin();
    if (origin !== undefined) opts["origin"] = origin;

    return opts;
  }

  #readOrigin(): Origin | undefined {
    const raw = this.getAttribute("origin");
    if (raw === null) return undefined;
    if (raw === "self") return this;
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
    const list = raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return list.length ? list : undefined;
  }

  #num(attr: string): number | undefined {
    const raw = this.getAttribute(attr);
    if (raw === null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
}
