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

export type FluidToastVariant = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * A single toast notification. Typically created via
 * `<fluid-toast>`.toast() rather than authored directly. Auto-dismisses
 * after `duration` ms unless `duration` is 0 (sticky).
 *
 * @summary One toast notification.
 *
 * @slot - Toast message body.
 * @slot icon - Custom leading icon.
 *
 * @csspart base - The outer container.
 * @csspart icon - The leading icon wrapper.
 * @csspart body - The body content.
 * @csspart close - The dismiss button.
 *
 * Every styled property reads a component-scoped `--fluid-toast-item-*` token
 * that falls back to a main semantic var (the override ladder). Variant accents
 * use the theme-independent semantic tone tokens.
 *
 * @cssproperty --fluid-toast-item-bg - Background color. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-toast-item-fg - Foreground text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-toast-item-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-toast-item-border-width - Border width. Falls back to 1px.
 * @cssproperty --fluid-toast-item-accent - Accent (left border) color. Falls back to the border color.
 * @cssproperty --fluid-toast-item-accent-width - Accent (left border) width. Falls back to 3px.
 * @cssproperty --fluid-toast-item-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-toast-item-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-toast-item-icon-fg - Default icon color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-toast-item-close-fg - Close button color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-toast-item-close-hover-bg - Close button hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-toast-item-close-hover-fg - Close button hover color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-toast-item-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-toast-item-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-toast-item-info-accent - Info variant accent + icon color. Falls back to --fluid-info-base.
 * @cssproperty --fluid-toast-item-success-accent - Success variant accent + icon color. Falls back to --fluid-success-base.
 * @cssproperty --fluid-toast-item-warning-accent - Warning variant accent + icon color. Falls back to --fluid-warning-base.
 * @cssproperty --fluid-toast-item-danger-accent - Danger variant accent + icon color. Falls back to --fluid-danger-base.
 *
 * @uses-token --fluid-surface-base - Default background.
 * @uses-token --fluid-surface-muted - Close-button hover background.
 * @uses-token --fluid-text-primary - Default text.
 * @uses-token --fluid-text-secondary - Icon + close-button color.
 * @uses-token --fluid-border-default - Default border.
 * @uses-token --fluid-info-base - Info variant accent.
 * @uses-token --fluid-success-base - Success variant accent.
 * @uses-token --fluid-warning-base - Warning variant accent.
 * @uses-token --fluid-danger-base - Danger variant accent.
 * @uses-token --fluid-focus-ring-color - Close-button focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum close-button hit-target size (24px AA / 44px AAA).
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-radius-sm - Close-button corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-shadow-lg - Toast elevation.
 *
 * @fires fluid-dismiss - Fired when the toast is dismissed (any reason).
 */
export class FluidToastItem extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
    :host {
      display: block;
    }

    .base {
      display: flex;
      align-items: flex-start;
      gap: var(--fluid-space-3);
      min-width: 16rem;
      max-width: 24rem;
      padding: var(--fluid-space-3) var(--fluid-space-4);
      background: var(--fluid-toast-item-bg, var(--fluid-surface-base));
      color: var(--fluid-toast-item-fg, var(--fluid-text-primary));
      border: var(--fluid-toast-item-border-width, 1px) solid
        var(--fluid-toast-item-border, var(--fluid-border-default));
      border-left: var(--fluid-toast-item-accent-width, 3px) solid
        var(--fluid-toast-item-accent, var(--fluid-toast-item-border, var(--fluid-border-default)));
      border-radius: var(--fluid-toast-item-radius, var(--fluid-radius-md));
      box-shadow: var(--fluid-shadow-lg);
      font-family: var(--fluid-toast-item-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-font-size-md);
      pointer-events: auto;
      animation: toast-in
        calc(var(--fluid-toast-item-enter-duration, var(--fluid-duration-normal)) * var(--fluid-motion, 1))
        var(--fluid-easing-decelerate);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    :host([dismissing]) .base {
      animation: toast-out
        calc(var(--fluid-toast-item-exit-duration, var(--fluid-duration-fast)) * var(--fluid-motion, 1))
        var(--fluid-easing-accelerate) forwards;
    }

    @keyframes toast-out {
      to {
        opacity: 0;
        transform: translateX(20px);
      }
    }

    .icon-slot {
      flex-shrink: 0;
      display: inline-flex;
      width: 1.25rem;
      height: 1.25rem;
      align-items: center;
      justify-content: center;
      color: var(--fluid-toast-item-icon-fg, var(--fluid-text-secondary));
    }

    .body {
      flex: 1 1 auto;
      min-width: 0;
      line-height: var(--fluid-font-line-height-normal);
    }

    /*
     * SC 2.5.8 Target Size. The close button floors its box to
     * --fluid-target-min (24px AA / 44px AAA) without resizing the glyph.
     */
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
      color: var(--fluid-toast-item-close-fg, var(--fluid-text-secondary));
      flex-shrink: 0;
      opacity: 0.6;
      transition: opacity var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    .close:hover,
    .close:focus-visible {
      opacity: 1;
      background: var(--fluid-toast-item-close-hover-bg, var(--fluid-surface-muted));
      color: var(--fluid-toast-item-close-hover-fg, var(--fluid-text-primary));
    }
    .close:focus-visible {
      outline: var(--fluid-toast-item-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-toast-item-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 1px;
    }

    /* Variant accents on the left border + icon, theme-independent tones. */
    :host([variant="info"]) .base {
      border-left-color: var(--fluid-toast-item-info-accent, var(--fluid-info-base));
    }
    :host([variant="info"]) .icon-slot {
      color: var(--fluid-toast-item-info-accent, var(--fluid-info-base));
    }
    :host([variant="success"]) .base {
      border-left-color: var(--fluid-toast-item-success-accent, var(--fluid-success-base));
    }
    :host([variant="success"]) .icon-slot {
      color: var(--fluid-toast-item-success-accent, var(--fluid-success-base));
    }
    :host([variant="warning"]) .base {
      border-left-color: var(--fluid-toast-item-warning-accent, var(--fluid-warning-base));
    }
    :host([variant="warning"]) .icon-slot {
      color: var(--fluid-toast-item-warning-accent, var(--fluid-warning-base));
    }
    :host([variant="danger"]) .base {
      border-left-color: var(--fluid-toast-item-danger-accent, var(--fluid-danger-base));
    }
    :host([variant="danger"]) .icon-slot {
      color: var(--fluid-toast-item-danger-accent, var(--fluid-danger-base));
    }
  `
  ];

  /** Visual variant, drives accent + default icon. */
  @property({ reflect: true }) variant: FluidToastVariant = "neutral";

  /** Auto-dismiss after this many ms. Pass 0 to make the toast sticky. */
  @property({ type: Number }) duration = 4000;

  /** Reflected attribute marking the dismissing animation phase. */
  @state() private dismissing = false;

  private timer?: ReturnType<typeof setTimeout>;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", this.variant === "danger" ? "alert" : "status");
    if (this.duration > 0) {
      this.timer = setTimeout(() => this.dismiss(), this.duration);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.timer);
  }

  protected override updated(): void {
    // dismissing is a private @state, which doesn't appear in PropertyValues<this>.
    // Unconditional attribute sync is cheap.
    if (this.dismissing) this.setAttribute("dismissing", "");
    else this.removeAttribute("dismissing");
  }

  /** Dismiss with an exit animation. */
  dismiss(): void {
    if (this.dismissing) return;
    clearTimeout(this.timer);
    this.dismissing = true;
    const cleanup = () => {
      this.dispatchEvent(new CustomEvent("fluid-dismiss", { bubbles: true, composed: true }));
    };
    // Wait for the exit animation, then notify.
    setTimeout(cleanup, 200);
  }

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
    const icon = this.defaultIconName();
    return html`
      <div part="base" class="base">
        <span part="icon" class="icon-slot">
          <slot name="icon">${icon ? html`<fluid-icon name=${icon}></fluid-icon>` : ""}</slot>
        </span>
        <div part="body" class="body"><slot></slot></div>
        <button
          part="close"
          class="close"
          type="button"
          aria-label="Dismiss"
          @click=${() => this.dismiss()}
        >
          <fluid-icon name="close"></fluid-icon>
        </button>
      </div>
    `;
  }
}
