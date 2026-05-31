import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Declarative wrapper around the Web Animations API. Place an element
 * inside and provide `keyframes` + `duration` to animate it. Use `play`,
 * `pause`, `cancel` props/methods to control playback.
 *
 * Common timing presets are accessible by name via the `name` attribute
 * (e.g. "fadeIn", "shake"). For finer control, set `keyframes` directly.
 *
 * This is a general-purpose motion *primitive* (the app-level companion to the
 * standard enter/exit animations baked into the overlay components). It lives in
 * core beside the observer utilities; it carries no dependencies and renders
 * `display: contents`, so it adds nothing to layout.
 *
 * @summary Web Animations API wrapper.
 *
 * @slot - The element to animate (the first slotted element is the target).
 *
 * @fires fluid-start - Fired when the animation starts.
 * @fires fluid-finish - Fired when the animation finishes.
 * @fires fluid-cancel - Fired when the animation is cancelled.
 */
export class FluidAnimation extends FluidElement {
  static override styles = css`
    :host {
      display: contents;
    }
  `;

  /** Named preset (overridden by explicit keyframes). */
  @property() name: string | null = null;

  /** Custom keyframes (overrides name). */
  @property({ attribute: false }) keyframes: Keyframe[] | null = null;

  /** Animation duration in ms. */
  @property({ type: Number }) duration = 600;

  /** Easing function. */
  @property() easing = "ease";

  /** Delay before starting. */
  @property({ type: Number }) delay = 0;

  /** Iterations (use `Infinity` for endless). */
  @property({ type: Number }) iterations = 1;

  /** Direction. */
  @property() direction: PlaybackDirection = "normal";

  /** Fill mode. */
  @property() fill: FillMode = "none";

  /** Auto-play when ready. */
  @property({ type: Boolean }) play = false;

  @state() private animation: Animation | null = null;

  private static presets: Record<string, Keyframe[]> = {
    fadeIn: [{ opacity: 0 }, { opacity: 1 }],
    fadeOut: [{ opacity: 1 }, { opacity: 0 }],
    slideInUp: [
      { transform: "translateY(20px)", opacity: 0 },
      { transform: "translateY(0)", opacity: 1 }
    ],
    slideInDown: [
      { transform: "translateY(-20px)", opacity: 0 },
      { transform: "translateY(0)", opacity: 1 }
    ],
    pulse: [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }],
    shake: [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(0)" }
    ],
    spin: [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }]
  };

  /** Trigger animation programmatically. */
  start(): void {
    this.cancel();
    const target = this.firstElementChild as HTMLElement | null;
    if (!target) return;
    const frames = this.keyframes ?? FluidAnimation.presets[this.name ?? "fadeIn"] ?? null;
    if (!frames) return;
    this.animation = target.animate(frames, {
      duration: this.duration,
      easing: this.easing,
      delay: this.delay,
      iterations: this.iterations,
      direction: this.direction,
      fill: this.fill
    });
    this.dispatchEvent(new CustomEvent("fluid-start", { bubbles: true, composed: true }));
    this.animation.onfinish = () =>
      this.dispatchEvent(new CustomEvent("fluid-finish", { bubbles: true, composed: true }));
    this.animation.oncancel = () =>
      this.dispatchEvent(new CustomEvent("fluid-cancel", { bubbles: true, composed: true }));
  }

  /** Pause the current animation. */
  pause(): void {
    this.animation?.pause();
  }

  /** Resume the current animation. */
  resume(): void {
    this.animation?.play();
  }

  /** Cancel the current animation. */
  cancel(): void {
    this.animation?.cancel();
    this.animation = null;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("play")) {
      if (this.play) this.start();
      else this.cancel();
    }
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
