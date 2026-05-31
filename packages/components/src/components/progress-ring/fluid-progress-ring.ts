import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Circular progress indicator. Compact alternative to `<fluid-progress-bar>`
 * for sidebars, toolbars, or anywhere horizontal space is at a premium.
 *
 * Size scales with `font-size`. Track + indicator thickness are tunable via
 * CSS variables.
 *
 * @summary Circular determinate progress ring.
 *
 * @slot - Optional content rendered in the center of the ring (typically the
 *   value text).
 *
 * @csspart base - The SVG element.
 * @csspart track - The background track.
 * @csspart indicator - The colored arc.
 * @csspart label - The center label wrapper.
 *
 * Every styled property reads a component-scoped `--fluid-progress-ring-*` token
 * that falls back to a main semantic var (the override ladder). Stroke
 * thickness is the `thickness` attribute (it drives the arc geometry, so it
 * can't be a pure CSS override).
 *
 * @cssproperty --fluid-progress-ring-size - Overall diameter. Falls back to 3rem.
 * @cssproperty --fluid-progress-ring-track - Track color. Falls back to --fluid-color-neutral-200.
 * @cssproperty --fluid-progress-ring-fill - Indicator color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-progress-ring-font-family - Center label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-progress-ring-label-fg - Center label text color. Falls back to --fluid-text-primary.
 *
 * @uses-token --fluid-color-neutral-200 - Default track color.
 * @uses-token --fluid-accent-base - Default indicator color.
 * @uses-token --fluid-text-primary - Center label color.
 * @uses-token --fluid-font-family-sans - Center label font family.
 */
export class FluidProgressRing extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      position: relative;
      width: var(--fluid-progress-ring-size, 3rem);
      height: var(--fluid-progress-ring-size, 3rem);
    }

    svg {
      width: 100%;
      height: 100%;
      /* Rotate so 0% starts at top. */
      transform: rotate(-90deg);
    }

    .track {
      stroke: var(--fluid-progress-ring-track, var(--fluid-color-neutral-200));
    }
    .indicator {
      stroke: var(--fluid-progress-ring-fill, var(--fluid-accent-base));
      stroke-linecap: round;
      transition: stroke-dashoffset var(--fluid-duration-normal) var(--fluid-easing-standard);
    }

    .label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--fluid-progress-ring-font-family, var(--fluid-font-family-sans));
      font-size: calc(var(--fluid-progress-ring-size, 3rem) * 0.28);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-progress-ring-label-fg, var(--fluid-text-primary));
      font-variant-numeric: tabular-nums;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .indicator {
        transition-duration: 0s;
      }
    }
  `;

  /** Progress value, 0–100. */
  @property({ type: Number }) value = 0;

  /** Ring stroke thickness in viewBox units (0–50). Drives the arc geometry. */
  @property({ type: Number }) thickness = 10;

  /** Show the value in the center as a percentage. */
  @property({ type: Boolean, attribute: "show-value" }) showValue = false;

  /** Formatter for the center label. */
  @property({ attribute: false }) valueFormatter?: (value: number) => string;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "progressbar");
    this.setAttribute("aria-valuemin", "0");
    this.setAttribute("aria-valuemax", "100");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Progress");
  }

  protected override updated(): void {
    const clamped = Math.max(0, Math.min(100, this.value));
    this.setAttribute("aria-valuenow", String(Math.round(clamped)));
  }

  override render(): TemplateResult {
    const clamped = Math.max(0, Math.min(100, this.value));
    // Geometry: SVG viewBox 100×100, radius adjusts to leave room for stroke.
    // thickness drives both the visual stroke AND the radius/dasharray math, so
    // it's a numeric property rather than a CSS var (a var couldn't reach JS).
    const thickness = Math.max(1, Math.min(50, this.thickness));
    const radius = 50 - thickness / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - clamped / 100);
    const formatted = this.valueFormatter
      ? this.valueFormatter(clamped)
      : `${Math.round(clamped)}%`;
    return html`
      <svg part="base" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <circle
          part="track"
          class="track"
          cx="50"
          cy="50"
          r=${radius}
          stroke-width=${thickness}
        ></circle>
        <circle
          part="indicator"
          class="indicator"
          cx="50"
          cy="50"
          r=${radius}
          stroke-width=${thickness}
          stroke-dasharray=${circumference}
          stroke-dashoffset=${offset}
        ></circle>
      </svg>
      ${this.showValue || this.children.length
        ? html`<div part="label" class="label"><slot>${formatted}</slot></div>`
        : ""}
    `;
  }
}
