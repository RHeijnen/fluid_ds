import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";

registerIcon(
  "close",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
);

export type FluidTagVariant = "neutral" | "info" | "success" | "warning" | "danger";
export type FluidTagSize = "sm" | "md" | "lg";

/**
 * Compact label for status, categories, or selections. Similar visual role
 * to `<fluid-badge>` but slightly larger, supports interaction (removal),
 * and uses a sharper corner radius, meant for stand-alone chips rather
 * than inline annotation.
 *
 * @summary Inline chip with optional remove button.
 *
 * @slot - Tag text or icon content.
 *
 * @csspart base - The pill container.
 * @csspart remove - The remove button (when `removable`).
 *
 * @cssproperty --fluid-tag-bg - Background color (neutral default).
 * @cssproperty --fluid-tag-fg - Foreground color (neutral default).
 * @cssproperty --fluid-tag-border - Outline border color (neutral default).
 * @cssproperty --fluid-tag-info-bg - Info variant background.
 * @cssproperty --fluid-tag-info-fg - Info variant text.
 * @cssproperty --fluid-tag-info-border - Info variant outline.
 * @cssproperty --fluid-tag-success-bg - Success variant background.
 * @cssproperty --fluid-tag-success-fg - Success variant text.
 * @cssproperty --fluid-tag-success-border - Success variant outline.
 * @cssproperty --fluid-tag-warning-bg - Warning variant background.
 * @cssproperty --fluid-tag-warning-fg - Warning variant text.
 * @cssproperty --fluid-tag-warning-border - Warning variant outline.
 * @cssproperty --fluid-tag-danger-bg - Danger variant background.
 * @cssproperty --fluid-tag-danger-fg - Danger variant text.
 * @cssproperty --fluid-tag-danger-border - Danger variant outline.
 * @cssproperty --fluid-tag-focus-ring - Remove button focus ring color.
 *
 * @uses-token --fluid-surface-muted - Neutral background.
 * @uses-token --fluid-text-primary - Neutral text.
 * @uses-token --fluid-border-default - Outline border.
 *
 * @fires fluid-remove - Dispatched when the user clicks the remove button.
 *   Consumers should remove the tag from their data model on this event.
 */
export class FluidTag extends FluidElement {
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
      padding: 0 var(--fluid-space-2);
      border-radius: var(--fluid-radius-sm);
      font-family: var(--fluid-font-family-sans);
      font-weight: var(--fluid-font-weight-medium);
      line-height: 1;
      white-space: nowrap;
      background-color: var(--fluid-tag-bg, var(--fluid-surface-muted));
      color: var(--fluid-tag-fg, var(--fluid-text-primary));
      box-shadow: inset 0 0 0 1px var(--fluid-tag-border, var(--fluid-border-default));
    }

    .size-sm {
      font-size: 11px;
      min-height: 1.125rem;
    }
    .size-md {
      font-size: var(--fluid-font-size-xs);
      min-height: 1.5rem;
    }
    .size-lg {
      font-size: var(--fluid-font-size-sm);
      min-height: 1.75rem;
    }

    .variant-info {
      background-color: var(--fluid-tag-info-bg, var(--fluid-color-brand-50));
      color: var(--fluid-tag-info-fg, var(--fluid-color-brand-800));
      box-shadow: inset 0 0 0 1px var(--fluid-tag-info-border, var(--fluid-color-brand-200));
    }
    .variant-success {
      background-color: var(--fluid-tag-success-bg, #ecfdf5);
      color: var(--fluid-tag-success-fg, #065f46);
      box-shadow: inset 0 0 0 1px var(--fluid-tag-success-border, #a7f3d0);
    }
    .variant-warning {
      background-color: var(--fluid-tag-warning-bg, #fffbeb);
      color: var(--fluid-tag-warning-fg, #92400e);
      box-shadow: inset 0 0 0 1px var(--fluid-tag-warning-border, #fcd34d);
    }
    .variant-danger {
      background-color: var(--fluid-tag-danger-bg, #fef2f2);
      color: var(--fluid-tag-danger-fg, #991b1b);
      box-shadow: inset 0 0 0 1px var(--fluid-tag-danger-border, #fecaca);
    }

    .remove {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
      margin-right: -0.25em;
      cursor: pointer;
      border-radius: var(--fluid-radius-full);
      color: inherit;
      opacity: 0.6;
      transition:
        opacity var(--fluid-duration-fast) var(--fluid-easing-standard),
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    .remove:hover,
    .remove:focus-visible {
      opacity: 1;
      background: rgb(0 0 0 / 0.08);
    }
    .remove:focus-visible {
      outline: 2px solid var(--fluid-tag-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 1px;
    }
    .remove fluid-icon {
      width: 0.75em;
      height: 0.75em;
    }
  `;

  /** Visual variant. */
  @property({ reflect: true }) variant: FluidTagVariant = "neutral";

  /** Size. */
  @property({ reflect: true }) size: FluidTagSize = "md";

  /** Show a removal × button. */
  @property({ type: Boolean, reflect: true }) removable = false;

  /** Disabled state, removal button can't be activated. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  private handleRemove = (e: Event) => {
    e.stopPropagation();
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent("fluid-remove", { bubbles: true, composed: true })
    );
  };

  override render(): TemplateResult {
    return html`
      <span part="base" class="base variant-${this.variant} size-${this.size}">
        <slot></slot>
        ${this.removable
          ? html`
              <button
                part="remove"
                class="remove"
                type="button"
                aria-label="Remove"
                ?disabled=${this.disabled}
                @click=${this.handleRemove}
              >
                <fluid-icon name="close"></fluid-icon>
              </button>
            `
          : ""}
      </span>
    `;
  }
}
