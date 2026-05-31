import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

let counter = 0;

/**
 * A small contextual hint shown on hover or focus.
 *
 * Wrap the trigger element as a slotted child:
 *
 * ```html
 * <fluid-tooltip content="Save changes">
 *   <fluid-button>Save</fluid-button>
 * </fluid-tooltip>
 * ```
 *
 * Positioning via @floating-ui/dom, automatically flips and shifts to stay
 * in the viewport.
 *
 * @summary Hover/focus contextual hint.
 *
 * @slot - The trigger element.
 * @slot content - Optional richer content. Overrides the `content` attribute.
 *
 * @csspart base - The outer wrapper.
 * @csspart popover - The floating popover element.
 *
 * Every styled property reads a component-scoped `--fluid-tooltip-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-tooltip-bg - Background. Falls back to --fluid-color-neutral-900.
 * @cssproperty --fluid-tooltip-color - Text color. Falls back to --fluid-color-white.
 * @cssproperty --fluid-tooltip-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-tooltip-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-tooltip-font-size - Font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-tooltip-max-width - Max width of the popover.
 *
 * @uses-token --fluid-color-neutral-900 - Default popover background.
 * @uses-token --fluid-color-white - Default popover text.
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-font-size-sm - Default font size.
 * @uses-token --fluid-shadow-md - Popover elevation.
 *
 * @fires fluid-show - Fired when the tooltip becomes visible.
 * @fires fluid-hide - Fired when the tooltip is dismissed.
 */
export class FluidTooltip extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
    :host {
      display: contents;
    }

    .popover {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1000;
      pointer-events: none;
      max-width: var(--fluid-tooltip-max-width, 16rem);
      padding: var(--fluid-space-1) var(--fluid-space-2);
      background: var(--fluid-tooltip-bg, var(--fluid-color-neutral-900));
      color: var(--fluid-tooltip-color, var(--fluid-color-white));
      font-family: var(--fluid-tooltip-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-tooltip-font-size, var(--fluid-font-size-sm));
      line-height: var(--fluid-font-line-height-tight);
      border-radius: var(--fluid-tooltip-radius, var(--fluid-radius-md));
      box-shadow: var(--fluid-shadow-md);
      opacity: 0;
      transform: translate(0, 0);
      transition: opacity var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    .popover.visible {
      opacity: 1;
    }
  `
  ];

  @query(".popover") private popoverEl!: HTMLElement;

  /** Tooltip text. */
  @property() content = "";

  /** Floating-ui placement. */
  @property() placement: Placement = "top";

  /** Show/hide delay in ms. Helps avoid flashing tooltips on quick passes. */
  @property({ type: Number }) showDelay = 100;
  @property({ type: Number }) hideDelay = 0;

  /** Force open/closed regardless of hover/focus. */
  @property({ type: Boolean }) open = false;

  /** Disable the tooltip. */
  @property({ type: Boolean }) disabled = false;

  @state() private visible = false;

  private tooltipId = `fluid-tooltip-${++counter}`;
  private anchor?: HTMLElement;
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private cleanupPosition?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("pointerover", this.handlePointerOver);
    this.addEventListener("pointerleave", this.handlePointerLeave);
    this.addEventListener("focusin", this.handleFocusIn);
    this.addEventListener("focusout", this.handleFocusOut);
    this.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("pointerover", this.handlePointerOver);
    this.removeEventListener("pointerleave", this.handlePointerLeave);
    this.removeEventListener("focusin", this.handleFocusIn);
    this.removeEventListener("focusout", this.handleFocusOut);
    this.removeEventListener("keydown", this.handleKeyDown);
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    this.detachAnchor();
  }

  protected override firstUpdated(): void {
    this.attachAnchor();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.show();
      else this.hide();
    }
  }

  private attachAnchor(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot:not([name])");
    const slotted = slot?.assignedElements({ flatten: true });
    this.anchor = slotted?.[0] as HTMLElement | undefined;
    if (!this.anchor) return;
    const existing = this.anchor.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
    if (!existing.includes(this.tooltipId)) {
      this.anchor.setAttribute(
        "aria-describedby",
        [...existing, this.tooltipId].filter(Boolean).join(" ")
      );
    }
  }

  private detachAnchor(): void {
    if (!this.anchor) return;
    const existing = (this.anchor.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((id) => id && id !== this.tooltipId);
    if (existing.length) this.anchor.setAttribute("aria-describedby", existing.join(" "));
    else this.anchor.removeAttribute("aria-describedby");
  }

  private handlePointerOver = () => this.scheduleShow();
  private handlePointerLeave = () => this.scheduleHide();
  private handleFocusIn = () => this.scheduleShow();
  private handleFocusOut = () => this.scheduleHide();
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.visible) {
      e.stopPropagation();
      this.scheduleHide(0);
    }
  };

  private scheduleShow(): void {
    if (this.disabled) return;
    clearTimeout(this.hideTimer);
    if (this.visible) return;
    this.showTimer = setTimeout(() => this.show(), this.showDelay);
  }

  private scheduleHide(delay = this.hideDelay): void {
    clearTimeout(this.showTimer);
    if (!this.visible) return;
    this.hideTimer = setTimeout(() => this.hide(), delay);
  }

  private async show(): Promise<void> {
    if (this.visible || !this.anchor) return;
    this.visible = true;
    await this.updateComplete;
    await this.reposition();
    this.dispatchEvent(new CustomEvent("fluid-show", { bubbles: true, composed: true }));
  }

  private hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.cleanupPosition?.();
    this.cleanupPosition = undefined;
    this.dispatchEvent(new CustomEvent("fluid-hide", { bubbles: true, composed: true }));
  }

  private async reposition(): Promise<void> {
    if (!this.anchor || !this.popoverEl) return;
    const { x, y } = await computePosition(this.anchor, this.popoverEl, {
      placement: this.placement,
      middleware: [offset(8), flip(), shift({ padding: 8 })]
    });
    Object.assign(this.popoverEl.style, { left: `${x}px`, top: `${y}px` });
  }

  override render(): TemplateResult {
    return html`
      <slot @slotchange=${this.attachAnchor}></slot>
      <div
        id=${this.tooltipId}
        part="popover"
        class="popover ${this.visible ? "visible" : ""}"
        role="tooltip"
        aria-hidden=${this.visible ? "false" : "true"}
      >
        <slot name="content">${this.content}</slot>
      </div>
    `;
  }
}
