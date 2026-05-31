import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";
import { motionStyles, reducedMotion } from "../../internal/motion.js";

registerIcon(
  "close",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
);

export type FluidDrawerPlacement = "start" | "end" | "top" | "bottom";

/**
 * Slide-in panel anchored to one edge of the viewport. Common uses: nav
 * menus, filters, secondary content. Like `<fluid-dialog>` but anchored
 * to an edge and typically wider/taller.
 *
 * Built on the native `<dialog>` element so the platform provides focus
 * trap, backdrop, and Escape-to-close.
 *
 * @summary Edge-anchored slide-in panel.
 *
 * @slot label - Title row.
 * @slot - Body content.
 * @slot footer - Footer actions.
 *
 * @csspart base - The native dialog element.
 * @csspart panel - The styled inner panel.
 * @csspart close - The close button.
 *
 * Every styled property reads a component-scoped `--fluid-drawer-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-drawer-bg - Panel background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-drawer-fg - Panel text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-drawer-backdrop - Modal backdrop fill. Falls back to rgb(0 0 0 / 0.4).
 * @cssproperty --fluid-drawer-font-family - Panel font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-drawer-size - Width (for start/end) or height (for top/bottom).
 * @cssproperty --fluid-drawer-border-width - Header/footer separator width. Falls back to 1px.
 * @cssproperty --fluid-drawer-header-border - Header separator color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-drawer-footer-border - Footer separator color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-drawer-footer-bg - Footer background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-drawer-close-fg - Close button color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-drawer-close-hover-bg - Close button hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-drawer-close-hover-fg - Close button hover color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-drawer-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-drawer-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty [--fluid-drawer-enter-duration=var(--fluid-duration-slow)] - Slide duration (scaled by --fluid-motion).
 * @cssproperty [--fluid-drawer-enter-easing=var(--fluid-easing-emphasized)] - Slide easing.
 *
 * @uses-token --fluid-surface-base - Default panel background.
 * @uses-token --fluid-surface-subtle - Footer background.
 * @uses-token --fluid-surface-muted - Close-button hover background.
 * @uses-token --fluid-text-primary - Default text.
 * @uses-token --fluid-text-secondary - Close-button color.
 * @uses-token --fluid-border-default - Header/footer separators.
 * @uses-token --fluid-focus-ring-color - Close-button focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum close-button hit-target size (24px AA / 44px AAA).
 * @uses-token --fluid-radius-sm - Close-button corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-shadow-lg - Panel elevation.
 *
 * @fires fluid-show - Fired when the drawer opens.
 * @fires fluid-hide - Fired when the drawer closes.
 */
export class FluidDrawer extends FluidElement {
  static override styles = [
    motionStyles,
    reducedMotion,
    css`
    :host {
      display: contents;
    }

    dialog {
      padding: 0;
      border: none;
      background: transparent;
      margin: 0;
      max-width: 100vw;
      max-height: 100vh;
      color: var(--fluid-drawer-fg, var(--fluid-text-primary));
    }

    dialog::backdrop {
      background: var(--fluid-drawer-backdrop, rgb(0 0 0 / 0.4));
      backdrop-filter: blur(2px);
      animation: fluid-backdrop-in
        calc(var(--fluid-drawer-enter-duration, var(--fluid-duration-slow)) * var(--fluid-motion, 1))
        var(--fluid-easing-standard);
    }

    .panel {
      position: fixed;
      display: flex;
      flex-direction: column;
      background: var(--fluid-drawer-bg, var(--fluid-surface-base));
      box-shadow: var(--fluid-shadow-lg);
      font-family: var(--fluid-drawer-font-family, var(--fluid-font-family-sans));
      transition: transform
        calc(var(--fluid-drawer-enter-duration, var(--fluid-duration-slow)) * var(--fluid-motion, 1))
        var(--fluid-drawer-enter-easing, var(--fluid-easing-emphasized));
    }

    /* Placement-based anchoring + slide direction. */
    :host([placement="start"]) .panel {
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--fluid-drawer-size, 22rem);
      transform: translateX(-100%);
    }
    :host([placement="end"]) .panel {
      top: 0;
      right: 0;
      bottom: 0;
      width: var(--fluid-drawer-size, 22rem);
      transform: translateX(100%);
    }
    :host([placement="top"]) .panel {
      top: 0;
      left: 0;
      right: 0;
      height: var(--fluid-drawer-size, 22rem);
      transform: translateY(-100%);
    }
    :host([placement="bottom"]) .panel {
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--fluid-drawer-size, 22rem);
      transform: translateY(100%);
    }

    :host([open]) .panel {
      transform: none;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
      padding: var(--fluid-space-4) var(--fluid-space-5);
      border-bottom: var(--fluid-drawer-border-width, 1px) solid
        var(--fluid-drawer-header-border, var(--fluid-border-default));
    }
    .header.empty {
      display: none;
    }

    .label {
      font-size: var(--fluid-font-size-lg);
      font-weight: var(--fluid-font-weight-semibold);
      flex: 1 1 auto;
    }

    /* SC 2.5.8 Target Size, floor the close button to --fluid-target-min. */
    .close {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      width: max(2rem, var(--fluid-target-min, 0px));
      height: max(2rem, var(--fluid-target-min, 0px));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--fluid-radius-sm);
      color: var(--fluid-drawer-close-fg, var(--fluid-text-secondary));
      flex-shrink: 0;
    }
    .close:hover {
      background: var(--fluid-drawer-close-hover-bg, var(--fluid-surface-muted));
      color: var(--fluid-drawer-close-hover-fg, var(--fluid-text-primary));
    }
    .close:focus-visible {
      outline: var(--fluid-drawer-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-drawer-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 1px;
    }

    .body {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: var(--fluid-space-5);
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--fluid-space-2);
      padding: var(--fluid-space-4) var(--fluid-space-5);
      border-top: var(--fluid-drawer-border-width, 1px) solid
        var(--fluid-drawer-footer-border, var(--fluid-border-default));
      background: var(--fluid-drawer-footer-bg, var(--fluid-surface-subtle));
    }
    .footer.empty {
      display: none;
    }
  `
  ];

  @query("dialog") private dialogEl!: HTMLDialogElement;

  /** Open state. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Edge to anchor to. */
  @property({ reflect: true }) placement: FluidDrawerPlacement = "end";

  /** Backdrop click closes. */
  @property({ type: Boolean, attribute: "light-dismiss" }) lightDismiss = true;

  /** Hide built-in close button. */
  @property({ type: Boolean, attribute: "no-close-button" }) noCloseButton = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  show(): void {
    this.open = true;
  }
  hide(): void {
    this.open = false;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.openNative();
      else this.closeNative();
    }
  }

  private openNative(): void {
    if (this.dialogEl && !this.dialogEl.open) {
      this.dialogEl.showModal();
      this.dispatchEvent(new CustomEvent("fluid-show", { bubbles: true, composed: true }));
    }
  }

  private closeNative(): void {
    if (this.dialogEl && this.dialogEl.open) this.dialogEl.close();
  }

  private handleDialogClose = () => {
    this.open = false;
    this.dispatchEvent(new CustomEvent("fluid-hide", { bubbles: true, composed: true }));
  };

  private handleBackdropClick = (e: MouseEvent) => {
    if (!this.lightDismiss) return;
    if (e.target === this.dialogEl) this.hide();
  };

  protected override firstUpdated(): void {
    const root = this.shadowRoot!;
    for (const slotName of ["label", "footer"]) {
      const slot = root.querySelector<HTMLSlotElement>(`slot[name="${slotName}"]`);
      const parent = slot?.parentElement;
      if (!slot || !parent) continue;
      const update = () => {
        const hasContent = slot.assignedNodes({ flatten: true }).length > 0;
        parent.classList.toggle("empty", !hasContent);
      };
      slot.addEventListener("slotchange", update);
      update();
    }
    if (this.open) this.openNative();
  }

  override render(): TemplateResult {
    return html`
      <dialog
        part="base"
        aria-label=${this.ariaLabel ?? ""}
        @close=${this.handleDialogClose}
        @click=${this.handleBackdropClick}
      >
        <div part="panel" class="panel">
          <div class="header">
            <div class="label"><slot name="label"></slot></div>
            ${this.noCloseButton
              ? ""
              : html`
                  <button
                    part="close"
                    class="close"
                    type="button"
                    aria-label="Close drawer"
                    @click=${() => this.hide()}
                  >
                    <fluid-icon name="close"></fluid-icon>
                  </button>
                `}
          </div>
          <div class="body"><slot></slot></div>
          <div class="footer"><slot name="footer"></slot></div>
        </div>
      </dialog>
    `;
  }
}
