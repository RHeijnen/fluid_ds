import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A responsive grid of pricing tiers. Lay out two or more
 * `<fluid-pricing-tier>` cards side by side; the grid wraps to a single
 * column on narrow viewports. Purely presentational: it provides the layout
 * and shared surface tokens, the tiers carry the content.
 *
 * @summary Responsive grid wrapper for pricing tiers.
 *
 * @slot - One or more `<fluid-pricing-tier>` elements.
 *
 * @csspart base - The grid container.
 *
 * @cssproperty --fluid-pricing-table-gap - Gap between tier cards. Falls back to --fluid-space-4.
 * @cssproperty --fluid-pricing-table-min - Minimum column width before wrapping. Falls back to 16rem.
 *
 * @uses-token --fluid-space-4 - Default gap between cards.
 */
export class FluidPricingTable extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: grid;
      grid-template-columns: repeat(
        auto-fit,
        minmax(min(var(--fluid-pricing-table-min, 16rem), 100%), 1fr)
      );
      gap: var(--fluid-pricing-table-gap, var(--fluid-space-4));
      align-items: stretch;
    }
  `;

  /** Accessible label for the group of tiers. */
  @property({ attribute: "label" }) label = "Pricing plans";

  override render(): TemplateResult {
    return html`
      <div part="base" class="base" role="group" aria-label=${this.label}>
        <slot></slot>
      </div>
    `;
  }
}
