import { html, css, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

registerIcon(
  "close",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
);

export type FluidBannerVariant = "info" | "success" | "warning" | "danger" | "neutral";

/**
 * Full-width announcement / notification bar that spans the top of a page,
 * section, or app shell. Unlike a callout (block-level, inline with prose) or a
 * toast (transient, floating), a banner is a persistent edge-to-edge strip used
 * for site-wide notices: maintenance windows, cookie consent, promotions, and
 * outage alerts.
 *
 * @summary Full-width notification bar with optional actions and dismiss.
 *
 * @slot - Banner message content.
 * @slot actions - Trailing action controls (links or buttons).
 *
 * @csspart base - The full-width bar container.
 * @csspart content - The message content wrapper.
 * @csspart actions - The trailing actions wrapper.
 * @csspart dismiss - The dismiss button (when `dismissible`).
 *
 * Every styled property reads a component-scoped `--fluid-banner-*` token that
 * falls back to a main semantic var or color primitive (the override ladder).
 *
 * @cssproperty --fluid-banner-bg - Background color (neutral default). Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-banner-fg - Foreground color (neutral default). Falls back to --fluid-text-primary.
 * @cssproperty --fluid-banner-border - Bottom border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-banner-padding-block - Vertical padding. Falls back to --fluid-space-3.
 * @cssproperty --fluid-banner-padding-inline - Horizontal padding. Falls back to --fluid-space-4.
 * @cssproperty --fluid-banner-gap - Gap between content, actions, and dismiss. Falls back to --fluid-space-3.
 * @cssproperty --fluid-banner-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-banner-focus-ring-width - Dismiss-button focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-banner-focus-ring - Dismiss-button focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-banner-info-bg - Info variant background.
 * @cssproperty --fluid-banner-info-fg - Info variant text.
 * @cssproperty --fluid-banner-info-border - Info variant bottom border.
 * @cssproperty --fluid-banner-success-bg - Success variant background.
 * @cssproperty --fluid-banner-success-fg - Success variant text.
 * @cssproperty --fluid-banner-success-border - Success variant bottom border.
 * @cssproperty --fluid-banner-warning-bg - Warning variant background.
 * @cssproperty --fluid-banner-warning-fg - Warning variant text.
 * @cssproperty --fluid-banner-warning-border - Warning variant bottom border.
 * @cssproperty --fluid-banner-danger-bg - Danger variant background.
 * @cssproperty --fluid-banner-danger-fg - Danger variant text.
 * @cssproperty --fluid-banner-danger-border - Danger variant bottom border.
 *
 * @uses-token --fluid-surface-muted - Neutral variant background.
 * @uses-token --fluid-text-primary - Neutral variant text.
 * @uses-token --fluid-border-default - Bottom border.
 * @uses-token --fluid-color-brand-50 - Info accent background.
 *
 * @fires fluid-dismiss - Fired when the dismiss button is clicked. The banner
 *   removes itself from the DOM after dispatching.
 */
export class FluidBanner extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        display: flex;
        align-items: center;
        gap: var(--fluid-banner-gap, var(--fluid-space-3));
        width: 100%;
        box-sizing: border-box;
        padding-block: var(--fluid-banner-padding-block, var(--fluid-space-3));
        padding-inline: var(--fluid-banner-padding-inline, var(--fluid-space-4));
        background-color: var(--fluid-banner-bg, var(--fluid-surface-muted));
        color: var(--fluid-banner-fg, var(--fluid-text-primary));
        border-bottom: 1px solid var(--fluid-banner-border, var(--fluid-border-default));
        font-family: var(--fluid-banner-font-family, var(--fluid-font-family-sans));
        font-size: var(--fluid-font-size-md);
        line-height: var(--fluid-font-line-height-normal);
      }

      .content {
        flex: 1 1 auto;
        min-width: 0;
      }

      ::slotted(*) {
        margin: 0 !important;
      }

      .actions {
        display: inline-flex;
        align-items: center;
        gap: var(--fluid-space-2);
        flex-shrink: 0;
      }
      .actions.empty {
        display: none;
      }

      /* SC 2.5.8 Target Size, floor the dismiss button to --fluid-target-min. */
      .dismiss {
        all: unset;
        cursor: pointer;
        box-sizing: border-box;
        width: max(1.5rem, var(--fluid-target-min, 0px));
        height: max(1.5rem, var(--fluid-target-min, 0px));
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--fluid-radius-sm);
        color: currentColor;
        opacity: 0.7;
        flex-shrink: 0;
        transition:
          opacity calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
            var(--fluid-easing-standard),
          background-color calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
            var(--fluid-easing-standard);
      }
      .dismiss:hover,
      .dismiss:focus-visible {
        opacity: 1;
        background: rgb(0 0 0 / 0.08);
      }
      .dismiss:focus-visible {
        outline: var(--fluid-banner-focus-ring-width, var(--fluid-focus-ring-width, 2px))
          solid var(--fluid-banner-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: 1px;
      }
      .dismiss fluid-icon {
        width: 1rem;
        height: 1rem;
      }

      /* Variant tints, theme-independent semantic / primitive tokens, each
         overridable per variant. */
      .variant-info {
        background-color: var(--fluid-banner-info-bg, var(--fluid-color-brand-50));
        color: var(--fluid-banner-info-fg, var(--fluid-color-brand-900));
        border-bottom-color: var(--fluid-banner-info-border, var(--fluid-color-brand-200));
      }
      .variant-success {
        background-color: var(--fluid-banner-success-bg, var(--fluid-color-emerald-50));
        color: var(--fluid-banner-success-fg, var(--fluid-color-emerald-900));
        border-bottom-color: var(--fluid-banner-success-border, var(--fluid-color-emerald-200));
      }
      .variant-warning {
        background-color: var(--fluid-banner-warning-bg, var(--fluid-color-amber-50));
        color: var(--fluid-banner-warning-fg, var(--fluid-color-amber-900));
        border-bottom-color: var(--fluid-banner-warning-border, var(--fluid-color-amber-300));
      }
      .variant-danger {
        background-color: var(--fluid-banner-danger-bg, var(--fluid-color-red-50));
        color: var(--fluid-banner-danger-fg, var(--fluid-color-red-900));
        border-bottom-color: var(--fluid-banner-danger-border, var(--fluid-color-red-200));
      }
    `
  ];

  /** Visual variant. Drives color and screen-reader urgency. */
  @property({ reflect: true }) variant: FluidBannerVariant = "neutral";

  /** When true, renders a dismiss button. Fires `fluid-dismiss` and removes the banner. */
  @property({ type: Boolean, reflect: true }) dismissible = false;

  /**
   * Optional accessible label for the banner region. When unset, the region's
   * name comes from the variant ("Notification" / "Alert"), so a screen-reader
   * landmark list still identifies the bar.
   */
  @property() label = "";

  /** Tracks whether the `actions` slot has assigned content (hides the wrapper otherwise). */
  @state() private hasActions = false;

  private handleActionsSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    this.hasActions = slot.assignedNodes({ flatten: true }).length > 0;
  };

  private handleDismiss = () => {
    this.dispatchEvent(
      new CustomEvent("fluid-dismiss", { bubbles: true, composed: true })
    );
    this.remove();
  };

  override render(): TemplateResult {
    // info / success are non-critical announcements (role="status"); warning /
    // danger are higher-urgency notices that get the "region" landmark so a
    // screen reader can jump to them and announce the accessible name.
    const polite = this.variant === "info" || this.variant === "success";
    const role = polite ? "status" : "region";
    const label =
      this.label || (this.variant === "danger" || this.variant === "warning" ? "Alert" : "Notification");

    return html`
      <div
        part="base"
        class="base variant-${this.variant}"
        role=${role}
        aria-label=${label}
      >
        <div part="content" class="content">
          <slot></slot>
        </div>
        <div part="actions" class="actions ${this.hasActions ? "" : "empty"}">
          <slot name="actions" @slotchange=${this.handleActionsSlotChange}></slot>
        </div>
        ${this.dismissible
          ? html`
              <button
                part="dismiss"
                class="dismiss"
                type="button"
                aria-label="Dismiss"
                @click=${this.handleDismiss}
              >
                <fluid-icon name="close"></fluid-icon>
              </button>
            `
          : ""}
      </div>
    `;
  }
}
