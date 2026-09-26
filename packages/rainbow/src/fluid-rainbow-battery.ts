import { html, css, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";

/**
 * A battery-shaped gauge in the Rainbow widget style: a rainbow cell that fills
 * to the value, an optional charging cord with a smiling plug, and an optional
 * heartbeat line underneath. Good for uptime, quota, health or progress-to-goal
 * readouts on a dashboard.
 *
 * Semantically it is a meter (APG Meter pattern): `role="meter"` with
 * `aria-valuemin` / `-max` / `-now` and an `aria-valuetext` that reads the
 * value as a localized percentage. Not interactive, so there is no keyboard
 * contract. The cord, plug and heartbeat are decorative and hidden from
 * assistive technology. If charging state matters to the reader, say so in the
 * label (for example "Charging").
 *
 * Motion (the charge shimmer, the heartbeat trace, the bobbing plug) stops
 * under `prefers-reduced-motion` and scales with the global `--fluid-motion`.
 *
 * @summary Battery-shaped gauge with charging and heartbeat flourishes.
 *
 * @slot - The label, e.g. "Uptime". Also the accessible name when `label` is unset.
 *
 * @csspart base - The whole widget.
 * @csspart body - The battery casing.
 * @csspart cell - The filled cell.
 * @csspart label - The label row.
 * @csspart pulse - The heartbeat row.
 *
 * @cssproperty --fluid-rainbow-battery-fill - Cell fill (any background). Falls back to a pastel rainbow gradient.
 * @cssproperty --fluid-rainbow-battery-casing - Casing background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-rainbow-battery-ink - Outline, cord and trace color. Falls back to --rainbow-line, then --fluid-text-secondary.
 * @cssproperty --fluid-rainbow-battery-border-width - Casing outline width. Falls back to --fluid-border-width-default.
 * @cssproperty --fluid-rainbow-battery-radius - Casing corner radius. Falls back to --fluid-radius-lg.
 * @cssproperty --fluid-rainbow-battery-plug - Plug face color. Falls back to --rainbow-yellow, then --fluid-color-amber-300.
 * @cssproperty --fluid-rainbow-battery-heart - Heart color. Falls back to --rainbow-rose, then --fluid-color-red-400.
 * @cssproperty --fluid-rainbow-battery-fg - Label color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-rainbow-battery-font-family - Label font. Falls back to --fluid-font-family-display.
 *
 * @uses-token --fluid-surface-base - Casing background.
 * @uses-token --fluid-text-secondary - Outline, cord and trace color outside the Rainbow brand.
 * @uses-token --fluid-border-width-default - Casing outline width.
 * @uses-token --fluid-radius-lg - Casing radius.
 * @uses-token --fluid-color-amber-300 - Plug face outside the Rainbow brand.
 * @uses-token --fluid-color-red-400 - Heart outside the Rainbow brand.
 * @uses-token --fluid-text-primary - Label color.
 * @uses-token --fluid-font-family-display - Label font.
 * @uses-token --fluid-font-weight-semibold - Label weight.
 * @uses-token --fluid-font-size-md - Label size.
 * @uses-token --fluid-space-2 - Row gap.
 * @uses-token --fluid-motion - Global motion scalar; 0 stops the flourishes.
 */
export class FluidRainbowBattery extends FluidElement {
  static override styles = css`
    :host {
      display: inline-block;
      inline-size: 12rem;
      color: var(--fluid-rainbow-battery-fg, var(--fluid-text-primary));
      font-family: var(--fluid-rainbow-battery-font-family, var(--fluid-font-family-display));
      font-size: var(--fluid-font-size-md, 0.875rem);
      line-height: 1.2;
      /* The casing outline carries the gauge shape, so outside Rainbow it uses a
         text color (3:1 or better on the surface) rather than a faint border. */
      --_ink: var(
        --fluid-rainbow-battery-ink,
        var(--rainbow-line, var(--fluid-text-secondary, currentColor))
      );
      --_bw: var(--fluid-rainbow-battery-border-width, var(--fluid-border-width-default, 1px));
      --_speed: max(var(--fluid-motion, 1), 0.001);
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: grid;
      gap: var(--fluid-space-2, 0.5rem);
    }

    .row {
      display: flex;
      align-items: center;
    }

    .body {
      position: relative;
      flex: 1 1 auto;
      block-size: 3rem;
      padding: 0.3rem;
      background: var(--fluid-rainbow-battery-casing, var(--fluid-surface-base, #fff));
      border: var(--_bw) solid var(--_ink);
      border-radius: var(--fluid-rainbow-battery-radius, var(--fluid-radius-lg, 0.75rem));
      box-sizing: border-box;
    }

    .cell {
      block-size: 100%;
      border-radius: calc(
        var(--fluid-rainbow-battery-radius, var(--fluid-radius-lg, 0.75rem)) * 0.55
      );
      background: var(
        --fluid-rainbow-battery-fill,
        linear-gradient(
          90deg,
          var(--rainbow-coral, #f28b7b),
          var(--rainbow-pink, #f6b3c4) 20%,
          var(--rainbow-yellow, #ffd86e) 40%,
          var(--rainbow-green, #9cc587) 60%,
          var(--rainbow-blue, #aebdf0) 80%,
          var(--rainbow-purple, #bba8e0)
        )
      );
      transform-origin: inline-start;
      transition: inline-size 0.4s ease;
    }

    :host([charging]) .cell {
      animation: charge calc(3.5s / var(--_speed)) ease-in-out infinite;
    }

    .nub {
      flex: none;
      inline-size: 0.45rem;
      block-size: 1.1rem;
      background: var(--_ink);
      border-radius: 0 0.3rem 0.3rem 0;
    }

    .cord {
      flex: none;
      inline-size: 3.25rem;
      block-size: 2.5rem;
      overflow: visible;
    }

    .plug {
      transform-box: fill-box;
      transform-origin: center;
      animation: bob calc(3s / var(--_speed)) ease-in-out infinite;
    }

    .label {
      display: flex;
      gap: 0.35em;
      font-weight: var(--fluid-font-weight-semibold, 600);
    }

    .label[hidden] {
      display: none;
    }

    ::slotted(*) {
      margin: 0 !important;
    }

    .value {
      font-variant-numeric: tabular-nums;
    }

    .pulse {
      display: block;
      inline-size: 100%;
      block-size: auto;
      overflow: visible;
    }

    .trace {
      opacity: 0.3;
    }

    /* A short bright segment that travels along the faint trace. */
    .blip {
      stroke-dasharray: 34 166;
      animation: beat calc(2.2s / var(--_speed)) linear infinite;
    }

    @keyframes charge {
      50% {
        opacity: 0.72;
      }
    }
    @keyframes bob {
      50% {
        transform: translateY(-3px);
      }
    }
    @keyframes beat {
      from {
        stroke-dashoffset: 200;
      }
      to {
        stroke-dashoffset: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host([charging]) .cell,
      .plug,
      .blip {
        animation: none;
      }
    }
  `;

  /** Current level. Clamped into [min, max]. */
  @property({ type: Number }) value = 0;

  /** Lower bound of the range. */
  @property({ type: Number }) min = 0;

  /** Upper bound of the range. */
  @property({ type: Number }) max = 100;

  /** Accessible name, before slotted text and the localized default. */
  @property() label?: string;

  /** Show the value as a percentage after the label. */
  @property({ type: Boolean, attribute: "show-value" }) showValue = false;

  /** Show the cord and plug and animate the cell. Decorative. */
  @property({ type: Boolean, reflect: true }) charging = false;

  /** Show the heart and heartbeat trace under the battery. Decorative. */
  @property({ type: Boolean, reflect: true }) pulse = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "meter");
  }

  private get fraction(): number {
    const lo = Math.min(this.min, this.max);
    const hi = Math.max(this.min, this.max);
    const v = Number.isFinite(this.value) ? Math.min(hi, Math.max(lo, this.value)) : lo;
    return hi > lo ? (v - lo) / (hi - lo) : 0;
  }

  private percent(fraction: number): string {
    const options = { style: "percent", maximumFractionDigits: 2 } as const;
    try {
      return new Intl.NumberFormat([this.localize.locale, "en"], options).format(fraction);
    } catch {
      return new Intl.NumberFormat("en", options).format(fraction);
    }
  }

  protected override updated(): void {
    const lo = Math.min(this.min, this.max);
    const hi = Math.max(this.min, this.max);
    const now = lo + this.fraction * (hi - lo);
    this.setAttribute("aria-valuemin", String(lo));
    this.setAttribute("aria-valuemax", String(hi));
    this.setAttribute("aria-valuenow", String(now));
    this.setAttribute("aria-valuetext", this.percent(this.fraction));
    const slotted = Array.from(this.childNodes ?? [])
      .filter((n) => n.nodeType === 3 || (n.nodeType === 1 && !(n as Element).getAttribute("slot")))
      .map((n) => n.textContent ?? "")
      .join("")
      .trim();
    this.updateDefaultAriaLabel(this.label ?? (slotted || this.term("meter")));
  }

  private renderCord(): TemplateResult | typeof nothing {
    if (!this.charging) return nothing;
    return html`
      <svg class="cord" viewBox="0 0 52 40" aria-hidden="true" focusable="false">
        <path
          d="M0 20c14 0 12 16 26 16"
          fill="none"
          stroke-width="3.5"
          stroke-linecap="round"
          style="stroke: var(--_ink)"
        />
        <g class="plug">
          <circle
            cx="38"
            cy="26"
            r="11"
            stroke-width="3"
            style="fill: var(--fluid-rainbow-battery-plug, var(--rainbow-yellow, var(--fluid-color-amber-300, #fcd34d))); stroke: var(--_ink)"
          />
          <circle cx="34" cy="24" r="1.6" style="fill: var(--_ink)" />
          <circle cx="42" cy="24" r="1.6" style="fill: var(--_ink)" />
          <path
            d="M34.5 29q3.5 3 7 0"
            fill="none"
            stroke-width="2.2"
            stroke-linecap="round"
            style="stroke: var(--_ink)"
          />
        </g>
      </svg>
    `;
  }

  private renderPulse(): TemplateResult | typeof nothing {
    if (!this.pulse) return nothing;
    return html`
      <svg
        part="pulse"
        class="pulse"
        viewBox="0 0 160 32"
        preserveAspectRatio="xMinYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M4 11a5 5 0 0 1 8 0 5 5 0 0 1 8 0c0 6-8 11-8 11s-8-5-8-11z"
          stroke-width="3"
          stroke-linejoin="round"
          style="fill: var(--fluid-rainbow-battery-heart, var(--rainbow-rose, var(--fluid-color-red-400, #f87171))); stroke: var(--_ink)"
        />
        <path
          class="trace"
          d="M28 16h26l6-10 8 20 6-10h60"
          fill="none"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="stroke: var(--_ink)"
        />
        <path
          class="blip"
          d="M28 16h26l6-10 8 20 6-10h60"
          fill="none"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="stroke: var(--_ink)"
        />
      </svg>
    `;
  }

  override render(): TemplateResult {
    const pct = (this.fraction * 100).toFixed(2);
    const hasLabel = Array.from(this.childNodes ?? []).some(
      (n) => n.nodeType === 1 || Boolean(n.textContent?.trim())
    );
    return html`
      <div part="base" class="base">
        <div class="row">
          <div part="body" class="body">
            <div part="cell" class="cell" style="inline-size: ${pct}%"></div>
          </div>
          <div class="nub"></div>
          ${this.renderCord()}
        </div>
        <div part="label" class="label" ?hidden=${!hasLabel && !this.showValue}>
          <slot @slotchange=${() => this.requestUpdate()}></slot>
          ${this.showValue
            ? html`<span class="value">${this.percent(this.fraction)}</span>`
            : nothing}
        </div>
        ${this.renderPulse()}
      </div>
    `;
  }
}
