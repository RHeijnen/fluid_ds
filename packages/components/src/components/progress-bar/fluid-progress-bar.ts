import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Horizontal progress indicator for tasks with measurable completion.
 * Switches to an indeterminate animation when `value` is null/undefined.
 *
 * @summary Determinate or indeterminate horizontal progress bar.
 *
 * @slot - Optional label content shown above the bar.
 *
 * @csspart base - The outer container.
 * @csspart track - The track (background).
 * @csspart indicator - The filled portion.
 * @csspart label - The label wrapper.
 *
 * Every styled property reads a component-scoped `--fluid-progress-bar-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-progress-bar-track - Track background color. Falls back to --fluid-color-neutral-200.
 * @cssproperty --fluid-progress-bar-fill - Fill color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-progress-bar-height - Track height. Falls back to 0.5rem.
 * @cssproperty --fluid-progress-bar-radius - Track + indicator corner radius. Falls back to --fluid-radius-full.
 * @cssproperty --fluid-progress-bar-font-family - Label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-progress-bar-label-fg - Label text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-progress-bar-value-fg - Value text color. Falls back to --fluid-text-secondary.
 *
 * @uses-token --fluid-color-neutral-200 - Default track color.
 * @uses-token --fluid-accent-base - Default fill color.
 * @uses-token --fluid-text-primary - Label text color.
 * @uses-token --fluid-text-secondary - Value text color.
 * @uses-token --fluid-radius-full - Default track corner radius.
 * @uses-token --fluid-font-family-sans - Label font family.
 * @uses-token --fluid-gradient-glossy - Indicator sheen.
 */
export class FluidProgressBar extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
      width: 100%;
    }

    .label {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--fluid-space-3);
      font-family: var(--fluid-progress-bar-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-progress-bar-label-fg, var(--fluid-text-primary));
    }

    .value-text {
      font-variant-numeric: tabular-nums;
      color: var(--fluid-progress-bar-value-fg, var(--fluid-text-secondary));
    }

    .track {
      position: relative;
      width: 100%;
      height: var(--fluid-progress-bar-height, 0.5rem);
      background: var(--fluid-progress-bar-track, var(--fluid-color-neutral-200));
      border-radius: var(--fluid-progress-bar-radius, var(--fluid-radius-full));
      overflow: hidden;
    }

    .indicator {
      position: absolute;
      inset: 0;
      background-color: var(--fluid-progress-bar-fill, var(--fluid-accent-base));
      background-image: var(--fluid-gradient-glossy);
      border-radius: inherit;
      transform-origin: left;
      transition: transform var(--fluid-duration-normal) var(--fluid-easing-standard);
    }

    /* Indeterminate: a moving segment loops across the track. */
    :host([indeterminate]) .indicator {
      width: 30%;
      transform-origin: center;
      animation: progress-loop 1.5s ease-in-out infinite;
    }

    @keyframes progress-loop {
      0% {
        transform: translateX(-150%);
      }
      100% {
        transform: translateX(450%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .indicator {
        transition-duration: 0s;
      }
      :host([indeterminate]) .indicator {
        animation-duration: 6s;
      }
    }
  `;

  /** Progress value 0–100. Pass null for indeterminate. */
  @property({ type: Number }) value: number | null = 0;

  /** Whether progress is indeterminate. Auto-set when value is null. */
  @property({ type: Boolean, reflect: true }) indeterminate = false;

  /** Show the value text (e.g. "42%") at the end of the label row. */
  @property({ type: Boolean, attribute: "show-value" }) showValue = false;

  /** Format function for the value display (e.g. `(v) => \`${v} of 100\``). */
  @property({ attribute: false }) valueFormatter?: (value: number) => string;

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.indeterminate = this.value === null || this.value === undefined;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "progressbar");
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) {
      this.setAttribute("aria-label", "Progress");
    }
  }

  protected override updated(): void {
    if (this.indeterminate || this.value === null || this.value === undefined) {
      this.removeAttribute("aria-valuenow");
    } else {
      const clamped = Math.max(0, Math.min(100, this.value));
      this.setAttribute("aria-valuenow", String(clamped));
      this.setAttribute("aria-valuemin", "0");
      this.setAttribute("aria-valuemax", "100");
    }
  }

  private renderLabel(): TemplateResult | "" {
    const hasSlot = this.children.length > 0;
    if (!hasSlot && !this.showValue) return "";
    const value =
      this.value === null || this.value === undefined ? null : Math.max(0, Math.min(100, this.value));
    const display =
      value === null ? "" : this.valueFormatter ? this.valueFormatter(value) : `${Math.round(value)}%`;
    return html`
      <div part="label" class="label">
        <slot></slot>
        ${this.showValue ? html`<span class="value-text">${display}</span>` : ""}
      </div>
    `;
  }

  override render(): TemplateResult {
    const value =
      this.value === null || this.value === undefined ? 0 : Math.max(0, Math.min(100, this.value));
    const scale = this.indeterminate ? 1 : value / 100;
    return html`
      <div part="base" class="base">
        ${this.renderLabel()}
        <div part="track" class="track">
          <div
            part="indicator"
            class="indicator"
            style=${this.indeterminate ? "" : `transform: scaleX(${scale});`}
          ></div>
        </div>
      </div>
    `;
  }
}
