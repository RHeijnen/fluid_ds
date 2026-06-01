/* eslint-disable lit-a11y/list -- the <ul> is populated by author <li> through
   a <slot>; the linter only sees the static <ul><slot> and can't resolve the
   slotted list items. At render time the flattened tree is a valid ul>li list. */
import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A single pricing card inside a `<fluid-pricing-table>`. Renders a plan name
 * (a semantic heading), a prominent price with an optional billing period, a
 * feature list (the default slot, rendered as a `<ul>`), and a call-to-action
 * region (the `action` slot). Set `featured` to highlight the recommended
 * plan; the highlighted surface keeps its accent foreground/background pair at
 * WCAG AA contrast.
 *
 * @summary One plan card: name, price, features, and a CTA.
 *
 * @slot - The feature list. Each child is treated as one list item.
 * @slot action - The call-to-action, typically a `<fluid-button>`.
 *
 * @csspart base - The card container.
 * @csspart header - The name + price header region.
 * @csspart name - The plan name heading.
 * @csspart price - The price line.
 * @csspart amount - The price amount.
 * @csspart period - The billing period suffix.
 * @csspart badge - The "featured" highlight badge.
 * @csspart features - The feature list wrapper.
 * @csspart action - The CTA wrapper.
 *
 * @cssproperty --fluid-pricing-tier-bg - Card background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-pricing-tier-fg - Card text. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-pricing-tier-muted-fg - Secondary text (period, label). Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-pricing-tier-border - Card border. Falls back to --fluid-border-default.
 * @cssproperty --fluid-pricing-tier-radius - Corner radius. Falls back to --fluid-radius-lg.
 * @cssproperty --fluid-pricing-tier-padding - Inner padding. Falls back to --fluid-space-5.
 * @cssproperty --fluid-pricing-tier-featured-bg - Featured card background. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-pricing-tier-featured-fg - Featured card text. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-pricing-tier-featured-border - Featured card border. Falls back to --fluid-accent-base.
 *
 * @uses-token --fluid-surface-base - Default card background.
 * @uses-token --fluid-text-primary - Default card text.
 * @uses-token --fluid-text-secondary - Period + label text.
 * @uses-token --fluid-border-default - Card border.
 * @uses-token --fluid-accent-base - Featured background + accent.
 * @uses-token --fluid-accent-text - Featured foreground.
 * @uses-token --fluid-radius-lg - Corner radius.
 */
export class FluidPricingTier extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      font-family: var(--fluid-font-family-sans);
      line-height: 1.5;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      gap: var(--fluid-space-4);
      padding: var(--fluid-pricing-tier-padding, var(--fluid-space-5));
      background: var(--fluid-pricing-tier-bg, var(--fluid-surface-base));
      color: var(--fluid-pricing-tier-fg, var(--fluid-text-primary));
      border: 1px solid var(--fluid-pricing-tier-border, var(--fluid-border-default));
      border-radius: var(--fluid-pricing-tier-radius, var(--fluid-radius-lg));
    }

    :host([featured]) .base {
      background: var(--fluid-pricing-tier-featured-bg, var(--fluid-accent-base));
      color: var(--fluid-pricing-tier-featured-fg, var(--fluid-accent-text));
      border-color: var(--fluid-pricing-tier-featured-border, var(--fluid-accent-base));
      box-shadow: var(--fluid-shadow-lg);
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
    }

    .name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-2);
    }

    .name {
      margin: 0;
      font-size: var(--fluid-font-size-lg, 1.125rem);
      font-weight: var(--fluid-font-weight-semibold, 600);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0 var(--fluid-space-2);
      min-height: 1.5rem;
      border-radius: var(--fluid-radius-full);
      font-size: var(--fluid-font-size-xs, 0.75rem);
      font-weight: var(--fluid-font-weight-medium, 500);
      white-space: nowrap;
      background: var(--fluid-pricing-tier-fg, var(--fluid-text-primary));
      color: var(--fluid-pricing-tier-bg, var(--fluid-surface-base));
    }

    /* On the featured card, the badge inverts the accent pair so it stays
       legible against the accent surface. */
    :host([featured]) .badge {
      background: var(--fluid-pricing-tier-featured-fg, var(--fluid-accent-text));
      color: var(--fluid-pricing-tier-featured-bg, var(--fluid-accent-base));
    }

    .price {
      display: flex;
      align-items: baseline;
      gap: var(--fluid-space-1);
      flex-wrap: wrap;
    }

    .amount {
      font-size: var(--fluid-pricing-tier-amount-size, 2.25rem);
      font-weight: var(--fluid-font-weight-bold, 700);
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }

    .period {
      font-size: var(--fluid-font-size-sm, 0.875rem);
      color: var(--fluid-pricing-tier-muted-fg, var(--fluid-text-secondary));
    }

    /* The muted secondary text must keep contrast on the accent surface, so on
       the featured card it inherits the (already AA) featured foreground. */
    :host([featured]) .period {
      color: var(--fluid-pricing-tier-featured-fg, var(--fluid-accent-text));
      opacity: 0.85;
    }

    .features {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
      flex: 1 1 auto;
      font-size: var(--fluid-font-size-sm, 0.875rem);
    }

    /* Slotted feature items inherit the page's prose styles, so pin spacing. */
    ::slotted(*) {
      margin: 0 !important;
    }

    .action {
      margin-top: auto;
    }

    .action ::slotted(*) {
      width: 100%;
    }
  `;

  /** Plan name shown as the card heading. */
  @property() name = "";

  /** Heading level for the plan name (2-6), for correct document outline. */
  @property({ type: Number, attribute: "heading-level" }) headingLevel = 3;

  /** The price amount, e.g. "$29" or "Free". */
  @property() price = "";

  /** Billing period suffix, e.g. "/mo" or "per seat". Shown after the price. */
  @property() period = "";

  /** Highlight this tier as the recommended plan. */
  @property({ type: Boolean, reflect: true }) featured = false;

  /** Label for the featured highlight badge. */
  @property({ attribute: "featured-label" }) featuredLabel = "Most popular";

  private renderName(): TemplateResult {
    const level = Math.min(6, Math.max(2, this.headingLevel));
    const inner = html`<span part="name" class="name" role="heading" aria-level=${level}
      >${this.name}</span
    >`;
    return inner;
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <div part="header" class="header">
          <div class="name-row">
            ${this.name ? this.renderName() : ""}
            ${this.featured
              ? html`<span part="badge" class="badge">${this.featuredLabel}</span>`
              : ""}
          </div>
          ${this.price
            ? html`<p part="price" class="price">
                <span part="amount" class="amount">${this.price}</span>
                ${this.period
                  ? html`<span part="period" class="period">${this.period}</span>`
                  : ""}
              </p>`
            : ""}
        </div>
        <ul part="features" class="features">
          <slot></slot>
        </ul>
        <div part="action" class="action">
          <slot name="action"></slot>
        </div>
      </div>
    `;
  }
}
