import { html, css, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidBadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";
export type FluidBadgeSize = "sm" | "md";

/**
 * A small pill-shaped label for status, counts, or tags.
 *
 * @summary Inline label / status indicator.
 *
 * @slot - Badge text or icon content.
 *
 * @csspart base - The pill container.
 *
 * @cssproperty --fluid-badge-bg - Background color (neutral variant default).
 * @cssproperty --fluid-badge-fg - Foreground color (neutral variant default).
 * @cssproperty --fluid-badge-info-bg - Info variant background.
 * @cssproperty --fluid-badge-info-fg - Info variant text.
 * @cssproperty --fluid-badge-success-bg - Success variant background.
 * @cssproperty --fluid-badge-success-fg - Success variant text.
 * @cssproperty --fluid-badge-warning-bg - Warning variant background.
 * @cssproperty --fluid-badge-warning-fg - Warning variant text.
 * @cssproperty --fluid-badge-danger-bg - Danger variant background.
 * @cssproperty --fluid-badge-danger-fg - Danger variant text.
 *
 * @uses-token --fluid-color-neutral-200 - Neutral variant background.
 * @uses-token --fluid-color-neutral-800 - Neutral variant text.
 * @uses-token --fluid-color-brand-100 - Info variant background.
 * @uses-token --fluid-color-brand-800 - Info variant text.
 * @uses-token --fluid-color-emerald-100 - Success variant background.
 * @uses-token --fluid-color-emerald-800 - Success variant text.
 * @uses-token --fluid-color-amber-100 - Warning variant background.
 * @uses-token --fluid-color-amber-800 - Warning variant text.
 * @uses-token --fluid-color-red-100 - Danger variant background.
 * @uses-token --fluid-color-red-800 - Danger variant text.
 */
export class FluidBadge extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-1);
      padding: 2px var(--fluid-space-2);
      border-radius: var(--fluid-radius-full);
      font-family: var(--fluid-font-family-sans);
      font-weight: var(--fluid-font-weight-medium);
      line-height: 1;
      white-space: nowrap;
      background: var(--fluid-badge-bg, var(--fluid-color-neutral-200));
      color: var(--fluid-badge-fg, var(--fluid-color-neutral-800));
    }

    .size-sm {
      font-size: 11px;
      min-height: 1rem;
      padding: 1px var(--fluid-space-1);
    }
    .size-md {
      font-size: var(--fluid-font-size-xs);
      min-height: 1.25rem;
    }

    .variant-info {
      background: var(--fluid-badge-info-bg, var(--fluid-color-brand-100));
      color: var(--fluid-badge-info-fg, var(--fluid-color-brand-800));
    }
    .variant-success {
      background: var(--fluid-badge-success-bg, var(--fluid-color-emerald-100));
      color: var(--fluid-badge-success-fg, var(--fluid-color-emerald-800));
    }
    .variant-warning {
      background: var(--fluid-badge-warning-bg, var(--fluid-color-amber-100));
      color: var(--fluid-badge-warning-fg, var(--fluid-color-amber-800));
    }
    .variant-danger {
      background: var(--fluid-badge-danger-bg, var(--fluid-color-red-100));
      color: var(--fluid-badge-danger-fg, var(--fluid-color-red-800));
    }

    .dot {
      display: inline-block;
      width: 0.5em;
      height: 0.5em;
      border-radius: var(--fluid-radius-full);
      background: currentColor;
    }
  `;

  /** Visual variant. */
  @property({ reflect: true }) variant: FluidBadgeVariant = "neutral";

  /** Size. */
  @property({ reflect: true }) size: FluidBadgeSize = "md";

  /** Show only a colored dot, no content, smaller footprint. */
  @property({ type: Boolean, reflect: true }) dot = false;

  /** Reactive mirror of the host name used by a dot-only status badge. */
  @property({ attribute: "aria-label" }) private dotAccessibleLabel: string | null = null;

  override render(): TemplateResult {
    // A dot-only badge has no rendered text, so status would be conveyed by
    // color alone (WCAG 1.4.1) with no accessible name (4.1.2). Forward any
    // author-supplied aria-label from the host onto the base span and expose a
    // status role so the dot carries that name. A visible text label should
    // still accompany the dot where possible.
    const dotLabel = this.dot ? this.dotAccessibleLabel : null;
    return html`
      <span
        part="base"
        class="base variant-${this.variant} size-${this.size}"
        role=${this.dot && dotLabel ? "status" : nothing}
        aria-label=${this.dot && dotLabel ? dotLabel : nothing}
      >
        ${this.dot ? html`<span class="dot" aria-hidden="true"></span>` : html`<slot></slot>`}
      </span>
    `;
  }
}
