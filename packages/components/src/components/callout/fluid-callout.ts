import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";

registerIcon(
  "close",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
);

export type FluidCalloutVariant = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Inline message block calling attention to surrounding content, tips,
 * warnings, errors, suggestions. Unlike a toast (transient) or a dialog
 * (modal), a callout sits inline with the page flow.
 *
 * @summary Block-level notice with icon and optional dismiss.
 *
 * @slot - Body content.
 * @slot icon - Custom leading icon (defaults to a variant-appropriate icon).
 * @slot header - Optional bold lead-in text shown above the body.
 *
 * @csspart base - The outer container.
 * @csspart icon - The leading icon wrapper.
 * @csspart body - The body content wrapper.
 * @csspart close - The dismiss button.
 *
 * Every styled property reads a component-scoped `--fluid-callout-*` token that
 * falls back to a main semantic var or color primitive (the override ladder).
 *
 * @cssproperty --fluid-callout-bg - Background color (neutral default). Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-callout-fg - Foreground color (neutral default). Falls back to --fluid-text-primary.
 * @cssproperty --fluid-callout-border - Accent border color (left edge). Falls back to --fluid-border-default.
 * @cssproperty --fluid-callout-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-callout-accent-width - Left accent border width. Falls back to 3px.
 * @cssproperty --fluid-callout-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-callout-focus-ring-width - Dismiss-button focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-callout-info-bg - Info variant background.
 * @cssproperty --fluid-callout-info-fg - Info variant text.
 * @cssproperty --fluid-callout-info-border - Info variant accent border.
 * @cssproperty --fluid-callout-success-bg - Success variant background.
 * @cssproperty --fluid-callout-success-fg - Success variant text.
 * @cssproperty --fluid-callout-success-border - Success variant accent border.
 * @cssproperty --fluid-callout-warning-bg - Warning variant background.
 * @cssproperty --fluid-callout-warning-fg - Warning variant text.
 * @cssproperty --fluid-callout-warning-border - Warning variant accent border.
 * @cssproperty --fluid-callout-danger-bg - Danger variant background.
 * @cssproperty --fluid-callout-danger-fg - Danger variant text.
 * @cssproperty --fluid-callout-danger-border - Danger variant accent border.
 * @cssproperty --fluid-callout-focus-ring - Focus ring color.
 *
 * @uses-token --fluid-surface-muted - Neutral variant background.
 * @uses-token --fluid-text-primary - Default text color.
 * @uses-token --fluid-color-brand-500 - Info accent.
 * @uses-token --fluid-border-default - Outline.
 *
 * @fires fluid-dismiss - Fired when the dismiss button is clicked.
 */
export class FluidCallout extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: flex-start;
      gap: var(--fluid-space-3);
      padding: var(--fluid-space-4);
      background-color: var(--fluid-callout-bg, var(--fluid-surface-muted));
      color: var(--fluid-callout-fg, var(--fluid-text-primary));
      border-radius: var(--fluid-callout-radius, var(--fluid-radius-md));
      border-left: var(--fluid-callout-accent-width, 3px) solid
        var(--fluid-callout-border, var(--fluid-border-default));
      font-family: var(--fluid-callout-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-font-size-md);
      line-height: var(--fluid-font-line-height-normal);
    }

    .icon-slot {
      width: 1.25rem;
      height: 1.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--fluid-callout-border, var(--fluid-text-primary));
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .body {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-1);
      min-width: 0;
    }

    .header {
      font-weight: var(--fluid-font-weight-semibold);
      color: inherit;
    }
    .header.empty {
      display: none;
    }

    /* SC 2.5.8 Target Size, floor the dismiss button to --fluid-target-min. */
    .close {
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
      opacity: 0.6;
      transition:
        opacity var(--fluid-duration-fast) var(--fluid-easing-standard),
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
      flex-shrink: 0;
    }
    .close:hover,
    .close:focus-visible {
      opacity: 1;
      background: rgb(0 0 0 / 0.06);
    }
    .close:focus-visible {
      outline: var(--fluid-callout-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-callout-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 1px;
    }

    /* Variant tints, soft surface + readable text + accent border, all from
       color-primitive tokens (theme-independent), overridable per variant. */
    .variant-info {
      background-color: var(--fluid-callout-info-bg, var(--fluid-color-brand-50));
      color: var(--fluid-callout-info-fg, var(--fluid-color-brand-900));
      border-left-color: var(--fluid-callout-info-border, var(--fluid-color-brand-500));
    }
    .variant-info .icon-slot {
      color: var(--fluid-callout-info-border, var(--fluid-color-brand-600));
    }
    .variant-success {
      background-color: var(--fluid-callout-success-bg, var(--fluid-color-emerald-50));
      color: var(--fluid-callout-success-fg, var(--fluid-color-emerald-900));
      border-left-color: var(--fluid-callout-success-border, var(--fluid-color-emerald-500));
    }
    .variant-success .icon-slot {
      color: var(--fluid-callout-success-border, var(--fluid-color-emerald-700));
    }
    .variant-warning {
      background-color: var(--fluid-callout-warning-bg, var(--fluid-color-amber-50));
      color: var(--fluid-callout-warning-fg, var(--fluid-color-amber-900));
      border-left-color: var(--fluid-callout-warning-border, var(--fluid-color-amber-500));
    }
    .variant-warning .icon-slot {
      color: var(--fluid-callout-warning-border, var(--fluid-color-amber-700));
    }
    .variant-danger {
      background-color: var(--fluid-callout-danger-bg, var(--fluid-color-red-50));
      color: var(--fluid-callout-danger-fg, var(--fluid-color-red-900));
      border-left-color: var(--fluid-callout-danger-border, var(--fluid-color-red-500));
    }
    .variant-danger .icon-slot {
      color: var(--fluid-callout-danger-border, var(--fluid-color-red-700));
    }
  `;

  /** Visual variant, drives default icon and color. */
  @property({ reflect: true }) variant: FluidCalloutVariant = "neutral";

  /** When true, renders a × dismiss button. Fires `fluid-dismiss` on click. */
  @property({ type: Boolean, reflect: true }) dismissible = false;

  private handleDismiss = () => {
    this.dispatchEvent(
      new CustomEvent("fluid-dismiss", { bubbles: true, composed: true })
    );
  };

  /** Default icon for the variant (used when no slot content is provided). */
  private defaultIconName(): string | null {
    switch (this.variant) {
      case "info":
        return "info";
      case "success":
        return "check";
      case "warning":
      case "danger":
        return "alert-triangle";
      default:
        return null;
    }
  }

  override render(): TemplateResult {
    const defaultIcon = this.defaultIconName();
    return html`
      <div
        part="base"
        class="base variant-${this.variant}"
        role=${this.variant === "danger" ? "alert" : "status"}
      >
        <span part="icon" class="icon-slot">
          <slot name="icon">
            ${defaultIcon ? html`<fluid-icon name=${defaultIcon}></fluid-icon>` : ""}
          </slot>
        </span>
        <div part="body" class="body">
          <div class="header"><slot name="header"></slot></div>
          <slot></slot>
        </div>
        ${this.dismissible
          ? html`
              <button
                part="close"
                class="close"
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
