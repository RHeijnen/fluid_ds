import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

type Trend = "up" | "down" | "neutral";

/**
 * A KPI / metric tile: a label, a prominent value, and an optional change
 * indicator with a trend direction. The change text always carries the value
 * (e.g. `+12%`), so direction is never conveyed by color alone (SC 1.4.1).
 *
 * @summary Display a single key metric.
 *
 * @slot - Extra value content (e.g. a unit or a sparkline) after the value.
 * @slot icon - An icon shown beside the value.
 *
 * @csspart base - The container.
 * @csspart label - The metric label.
 * @csspart value - The metric value.
 * @csspart change - The change indicator.
 *
 * @cssproperty --fluid-stat-bg - Background. Falls back to transparent.
 * @cssproperty --fluid-stat-fg - Value text. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-stat-label-fg - Label text. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-stat-up-fg - Upward trend color. Falls back to --fluid-success-text.
 * @cssproperty --fluid-stat-down-fg - Downward trend color. Falls back to --fluid-danger-text.
 * @cssproperty --fluid-stat-radius - Corner radius. Falls back to --fluid-radius-lg.
 *
 * @uses-token --fluid-text-primary - Value text.
 * @uses-token --fluid-text-secondary - Label + neutral change text.
 * @uses-token --fluid-success-text - Upward trend.
 * @uses-token --fluid-danger-text - Downward trend.
 */
export class FluidStat extends FluidElement {
  static override styles = css`
    :host {
      display: inline-block;
      font-family: var(--fluid-font-family-sans);
    }
    .base {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: var(--fluid-stat-padding, 0);
      background: var(--fluid-stat-bg, transparent);
      border-radius: var(--fluid-stat-radius, var(--fluid-radius-lg, 0.75rem));
    }
    .label {
      font-size: var(--fluid-font-size-sm, 0.875rem);
      color: var(--fluid-stat-label-fg, var(--fluid-text-secondary));
    }
    .value-row {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .value {
      font-size: var(--fluid-stat-value-size, 1.875rem);
      font-weight: 700;
      line-height: 1.1;
      color: var(--fluid-stat-fg, var(--fluid-text-primary));
      font-variant-numeric: tabular-nums;
    }
    .change {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: var(--fluid-font-size-sm, 0.875rem);
      font-weight: 600;
      color: var(--fluid-stat-label-fg, var(--fluid-text-secondary));
    }
    .change[data-trend="up"] { color: var(--fluid-stat-up-fg, var(--fluid-success-text)); }
    .change[data-trend="down"] { color: var(--fluid-stat-down-fg, var(--fluid-danger-text)); }
    ::slotted([slot="icon"]) { width: 1.25rem; height: 1.25rem; }
  `;

  /** The metric label. */
  @property() label = "";

  /** The metric value. */
  @property() value = "";

  /** The change text, e.g. `+12%` or `-3`. Shown only when set. */
  @property() change = "";

  /** Trend direction (drives the arrow + color). */
  @property({ reflect: true }) trend: Trend = "neutral";

  private get arrow(): string {
    return this.trend === "up" ? "↑" : this.trend === "down" ? "↓" : "→";
  }

  override render(): TemplateResult {
    const summary = [this.label, this.value, this.change].filter(Boolean).join(", ");
    return html`
      <div part="base" class="base" role="group" aria-label=${summary}>
        ${this.label ? html`<span part="label" class="label">${this.label}</span>` : ""}
        <span class="value-row">
          <slot name="icon"></slot>
          <span part="value" class="value">${this.value}<slot></slot></span>
        </span>
        ${this.change
          ? html`<span part="change" class="change" data-trend=${this.trend}
              ><span aria-hidden="true">${this.arrow}</span> ${this.change}</span
            >`
          : ""}
      </div>
    `;
  }
}
