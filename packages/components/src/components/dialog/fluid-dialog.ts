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

export type FluidDialogSize = "sm" | "md" | "lg" | "xl" | "fullscreen";

/**
 * Modal dialog built on the native `<dialog>` element. The platform handles
 * focus trap, backdrop, and Escape-to-close for us, we add styling, slots,
 * and reactive open state.
 *
 * @summary Modal dialog that interrupts the main page flow.
 *
 * @slot label - Title row (heading).
 * @slot - Main body content.
 * @slot footer - Footer actions (typically buttons).
 *
 * @csspart base - The native dialog element.
 * @csspart panel - The styled inner panel.
 * @csspart header - The header section.
 * @csspart body - The body section.
 * @csspart footer - The footer section.
 * @csspart close - The close (×) button.
 *
 * Every styled property reads a component-scoped `--fluid-dialog-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-dialog-bg - Panel background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-dialog-fg - Panel text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-dialog-backdrop - Modal backdrop fill. Falls back to rgb(0 0 0 / 0.4).
 * @cssproperty --fluid-dialog-radius - Panel corner radius. Falls back to --fluid-radius-lg.
 * @cssproperty --fluid-dialog-font-family - Panel font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-dialog-max-width - Max width of the panel.
 * @cssproperty --fluid-dialog-border-width - Header/footer separator width. Falls back to 1px.
 * @cssproperty --fluid-dialog-header-border - Header separator color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-dialog-footer-border - Footer separator color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-dialog-footer-bg - Footer background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-dialog-close-fg - Close button color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-dialog-close-hover-bg - Close button hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-dialog-close-hover-fg - Close button hover color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-dialog-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-dialog-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty [--fluid-dialog-enter-animation=fluid-scale-in] - Panel open animation. Set to another preset (fluid-slide-in-up, fluid-fade-in, …) or `none`.
 * @cssproperty [--fluid-dialog-enter-duration=var(--fluid-duration-normal)] - Panel open duration (scaled by --fluid-motion).
 * @cssproperty [--fluid-dialog-enter-easing=var(--fluid-easing-emphasized)] - Panel open easing.
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
 * @uses-token --fluid-radius-lg - Default panel corner radius.
 * @uses-token --fluid-radius-sm - Close-button corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-shadow-lg - Panel elevation.
 *
 * @fires fluid-show - Fired when the dialog opens.
 * @fires fluid-hide - Fired when the dialog closes (any reason).
 */
export class FluidDialog extends FluidElement {
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
      max-width: 100vw;
      max-height: 100vh;
      color: var(--fluid-dialog-fg, var(--fluid-text-primary));
    }

    /* Modal backdrop, slightly tinted with the surface color. */
    dialog::backdrop {
      background: var(--fluid-dialog-backdrop, rgb(0 0 0 / 0.4));
      backdrop-filter: blur(2px);
      animation: fluid-backdrop-in
        calc(var(--fluid-dialog-enter-duration, var(--fluid-duration-fast)) * var(--fluid-motion, 1))
        var(--fluid-easing-standard);
    }

    .panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: var(--fluid-dialog-max-width, 32rem);
      max-height: calc(100vh - 4rem);
      background: var(--fluid-dialog-bg, var(--fluid-surface-base));
      border-radius: var(--fluid-dialog-radius, var(--fluid-radius-lg));
      box-shadow: var(--fluid-shadow-lg);
      font-family: var(--fluid-dialog-font-family, var(--fluid-font-family-sans));
      overflow: hidden;
      animation: var(--fluid-dialog-enter-animation, fluid-scale-in)
        calc(var(--fluid-dialog-enter-duration, var(--fluid-duration-normal)) * var(--fluid-motion, 1))
        var(--fluid-dialog-enter-easing, var(--fluid-easing-emphasized)) both;
    }

    /* Size variants. */
    :host([size="sm"]) .panel {
      max-width: 22rem;
    }
    :host([size="md"]) .panel {
      max-width: 32rem;
    }
    :host([size="lg"]) .panel {
      max-width: 48rem;
    }
    :host([size="xl"]) .panel {
      max-width: 64rem;
    }
    :host([size="fullscreen"]) .panel {
      max-width: 100vw;
      max-height: 100vh;
      width: 100vw;
      height: 100vh;
      border-radius: 0;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
      padding: var(--fluid-space-4) var(--fluid-space-5);
      border-bottom: var(--fluid-dialog-border-width, 1px) solid
        var(--fluid-dialog-header-border, var(--fluid-border-default));
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
      color: var(--fluid-dialog-close-fg, var(--fluid-text-secondary));
      flex-shrink: 0;
    }
    .close:hover {
      background: var(--fluid-dialog-close-hover-bg, var(--fluid-surface-muted));
      color: var(--fluid-dialog-close-hover-fg, var(--fluid-text-primary));
    }
    .close:focus-visible {
      outline: var(--fluid-dialog-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-dialog-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 1px;
    }

    .body {
      padding: var(--fluid-space-5);
      overflow-y: auto;
      flex: 1 1 auto;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--fluid-space-2);
      padding: var(--fluid-space-4) var(--fluid-space-5);
      border-top: var(--fluid-dialog-border-width, 1px) solid
        var(--fluid-dialog-footer-border, var(--fluid-border-default));
      background: var(--fluid-dialog-footer-bg, var(--fluid-surface-subtle));
    }
    .footer.empty {
      display: none;
    }
  `
  ];

  @query("dialog") private dialogEl!: HTMLDialogElement;

  /** Open state. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Size variant. */
  @property({ reflect: true }) size: FluidDialogSize = "md";

  /** Whether clicking the backdrop closes the dialog. Default true. */
  @property({ type: Boolean, attribute: "light-dismiss" }) lightDismiss = true;

  /** Hide the built-in close (×) button. */
  @property({ type: Boolean, attribute: "no-close-button" }) noCloseButton = false;

  /** Accessible label (used when no label slot content). */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  /** Show the dialog. */
  show(): void {
    this.open = true;
  }

  /** Hide the dialog. Returns immediately; consumers should await fluid-hide. */
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
    if (!this.dialogEl) return;
    if (!this.dialogEl.open) {
      this.dialogEl.showModal();
      this.dispatchEvent(new CustomEvent("fluid-show", { bubbles: true, composed: true }));
    }
  }

  private closeNative(): void {
    if (!this.dialogEl) return;
    if (this.dialogEl.open) this.dialogEl.close();
  }

  private handleDialogClose = () => {
    // The native dialog can close via Escape, form submission, etc. Sync state.
    this.open = false;
    this.dispatchEvent(new CustomEvent("fluid-hide", { bubbles: true, composed: true }));
  };

  private handleBackdropClick = (e: MouseEvent) => {
    if (!this.lightDismiss) return;
    // The backdrop is the dialog element itself when clicked outside the panel.
    if (e.target === this.dialogEl) this.hide();
  };

  override render(): TemplateResult {
    return html`
      <dialog
        part="base"
        aria-label=${this.ariaLabel ?? ""}
        @close=${this.handleDialogClose}
        @click=${this.handleBackdropClick}
      >
        <div part="panel" class="panel">
          <div part="header" class="header">
            <div class="label"><slot name="label"></slot></div>
            ${this.noCloseButton
              ? ""
              : html`
                  <button
                    part="close"
                    class="close"
                    type="button"
                    aria-label="Close dialog"
                    @click=${() => this.hide()}
                  >
                    <fluid-icon name="close"></fluid-icon>
                  </button>
                `}
          </div>
          <div part="body" class="body"><slot></slot></div>
          <div part="footer" class="footer"><slot name="footer"></slot></div>
        </div>
      </dialog>
    `;
  }

  protected override firstUpdated(): void {
    // Hide header/footer if empty.
    const root = this.shadowRoot!;
    for (const slotName of ["label", "footer"]) {
      const slot = root.querySelector<HTMLSlotElement>(`slot[name="${slotName}"]`);
      const parent = slot?.parentElement?.parentElement;
      if (!parent) continue;
      const update = () => {
        const hasContent = (slot!.assignedNodes({ flatten: true }) ?? []).length > 0;
        if (slotName === "label") {
          parent.querySelector(".header")?.classList.toggle("empty", !hasContent && this.noCloseButton);
        }
        if (slotName === "footer") {
          parent.querySelector(".footer")?.classList.toggle("empty", !hasContent);
        }
      };
      slot?.addEventListener("slotchange", update);
      update();
    }
    if (this.open) this.openNative();
  }
}
