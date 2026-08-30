import { html, css, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import { motionStyles, reducedMotion } from "../../internal/motion.js";

export type FluidDialogSize = "sm" | "md" | "lg" | "xl" | "fullscreen";

export type FluidDialogShowEvent = CustomEvent<null>;
export type FluidDialogHideEvent = CustomEvent<null>;

/**
 * Modal dialog built on the native `<dialog>` element. The platform handles
 * focus trap, backdrop, and Escape-to-close for us, we add styling, slots,
 * and reactive open state.
 *
 * @summary Modal dialog that interrupts the main page flow.
 *
 * @slot label - Title row (heading).
 * @slot heading - Alias for the label slot; renders in the title row when no label content is slotted.
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
 * @cssproperty --fluid-dialog-shadow - Panel elevation. Falls back to --fluid-shadow-lg.
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
 * @fires {FluidDialogShowEvent} fluid-show - Fired when the dialog opens.
 * @fires {FluidDialogHideEvent} fluid-hide - Fired when the dialog closes (any reason).
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
          calc(
            var(--fluid-dialog-enter-duration, var(--fluid-duration-fast)) * var(--fluid-motion, 1)
          )
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
        box-shadow: var(--fluid-dialog-shadow, var(--fluid-shadow-lg));
        font-family: var(--fluid-dialog-font-family, var(--fluid-font-family-sans));
        overflow: hidden;
        animation: var(--fluid-dialog-enter-animation, fluid-scale-in)
          calc(
            var(--fluid-dialog-enter-duration, var(--fluid-duration-normal)) *
              var(--fluid-motion, 1)
          )
          var(--fluid-dialog-enter-easing, var(--fluid-easing-emphasized)) both;
      }

      /* Size variants. */
      :host([size="sm"]) .panel {
        max-width: 22rem;
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
      .header.empty,
      .footer.empty {
        display: none;
      }
    `
  ];

  private get dialogEl(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  /** Open state. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Size variant. */
  @property({ reflect: true }) size: FluidDialogSize = "md";

  /**
   * Whether clicking the backdrop closes the dialog. Default true.
   *
   * PROPERTY ONLY, on purpose. A boolean attribute cannot express
   * `false` (its mere presence means true), so a `light-dismiss`
   * attribute could never turn a true-by-default behavior off and would
   * only mislead. Use the `no-light-dismiss` attribute from markup, or
   * set this property from JavaScript.
   */
  @property({ type: Boolean, attribute: false }) lightDismiss = true;

  /** Prevent backdrop clicks from closing the dialog. */
  @property({ type: Boolean, attribute: "no-light-dismiss" }) noLightDismiss = false;

  /** Hide the built-in close (×) button. */
  @property({ type: Boolean, attribute: "no-close-button" }) noCloseButton = false;

  /** Accessible label (used when no label slot content). */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  /** Accessible label for the internal native dialog. */
  @property() label = "";

  override attributeChangedCallback(
    name: string,
    oldValue: string | null,
    value: string | null
  ): void {
    if (name === "aria-label" && value !== null) {
      // `aria-label` is not permitted on a role-less custom-element host. Keep
      // the established consumer API, but move the value synchronously to the
      // internal native dialog and remove the invalid host attribute.
      this.label = value;
      this.removeAttribute(name);
      return;
    }
    super.attributeChangedCallback(name, oldValue, value);
  }

  /** Show the dialog. */
  show(): void {
    this.open = true;
  }

  /** Hide the dialog. Returns immediately; consumers should await fluid-hide. */
  hide(): void {
    this.open = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.hasUpdated && this.open) {
      void this.updateComplete.then(() => {
        if (this.open) this.presentNativeModal();
      });
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.presentNativeModal();
      else this.dialogEl?.close();
    }
  }

  private presentNativeModal(): void {
    const dialog = this.dialogEl;
    if (!this.isConnected || !dialog || dialog.matches(":modal")) return;
    const emitShow = !dialog.open;

    // Removing an open native dialog from the document removes it from the
    // top layer without clearing its `open` state. Clear only that stale
    // presentation state before restoring modality on reconnect.
    if (dialog.open) dialog.removeAttribute("open");

    dialog.showModal();
    this.ensureFocusWithin();
    if (emitShow) {
      this.dispatchEvent(
        new CustomEvent<null>("fluid-show", { detail: null, bubbles: true, composed: true })
      );
    }
  }

  private ensureFocusWithin(): void {
    const target =
      this.querySelector<HTMLElement>("[autofocus]:not([disabled])") ??
      (this.matches(":focus-within") ? null : this.renderRoot.querySelector<HTMLElement>(".close"));
    target?.focus();
  }

  private handleDialogClose(): void {
    // The native dialog can close via Escape, form submission, etc. Sync state.
    this.open = false;
    this.dispatchEvent(
      new CustomEvent<null>("fluid-hide", { detail: null, bubbles: true, composed: true })
    );
  }

  /**
   * A backdrop click reports the dialog element itself as the target. The
   * pointerdown guard additionally requires the gesture to have STARTED on the
   * backdrop, so a drag that begins inside the panel (selecting text, dragging
   * a slider) and releases outside it does not dismiss.
   */
  private dismissCandidate = false;

  private handleBackdropPointerDown(e: PointerEvent): void {
    this.dismissCandidate = e.target === this.dialogEl;
  }

  private handleBackdropClick(e: MouseEvent): void {
    if (this.noLightDismiss || !this.lightDismiss) return;
    if (!this.dismissCandidate) return;
    this.dismissCandidate = false;
    // The backdrop is the dialog element itself when clicked outside the panel.
    if (e.target === this.dialogEl) this.hide();
  }

  override render(): TemplateResult {
    const accessibleLabel = this.label || this.ariaLabel;
    return html`
      <dialog
        part="base"
        aria-label=${accessibleLabel || nothing}
        aria-labelledby=${accessibleLabel ? nothing : "fluid-dialog-label"}
        @close=${this.handleDialogClose}
        @pointerdown=${this.handleBackdropPointerDown}
        @click=${this.handleBackdropClick}
      >
        <div part="panel" class="panel">
          <div part="header" class="header">
            <div id="fluid-dialog-label" class="label">
              <slot name="label"><slot name="heading"></slot></slot>
            </div>
            ${this.noCloseButton
              ? ""
              : html`
                  <button
                    part="close"
                    class="close"
                    type="button"
                    aria-label=${this.term("closeDialog")}
                    @click=${this.hide}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="1em"
                      height="1em"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="m6 6 12 12M18 6 6 18"></path>
                    </svg>
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
      const section = slot?.closest<HTMLElement>(".header,.footer");
      if (!section) continue;
      const update = () => {
        const hasContent = slot!.assignedNodes({ flatten: true }).length > 0;
        section.classList.toggle(
          "empty",
          !hasContent && (slotName === "footer" || this.noCloseButton)
        );
      };
      this.listen(slot!, "slotchange", update);
      update();
    }
    if (this.open) this.presentNativeModal();
  }
}
