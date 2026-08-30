import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type Placement
} from "../../internal/position.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

export type FluidTooltipShowEvent = CustomEvent<null>;
export type FluidTooltipHideEvent = CustomEvent<null>;

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
 * Positioning via Fluid's in-house engine, automatically flips and shifts to
 * stay in the viewport and tracks the anchor while it is visible.
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
 * @cssproperty --fluid-tooltip-shadow - Popover elevation. Falls back to --fluid-shadow-md.
 *
 * @uses-token --fluid-color-neutral-900 - Default popover background.
 * @uses-token --fluid-color-white - Default popover text.
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-font-size-sm - Default font size.
 * @uses-token --fluid-shadow-md - Popover elevation.
 *
 * @fires {FluidTooltipShowEvent} fluid-show - Fired when the tooltip becomes visible.
 * @fires {FluidTooltipHideEvent} fluid-hide - Fired when the tooltip is dismissed.
 */
export class FluidTooltip extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: contents;
      }

      .popover {
        /*
         * Rendered in the top layer via popover="manual" (see render), which is
         * what actually makes it immune to transformed, filtered or contained
         * ancestors: a plain position:fixed anchors to the nearest ancestor
         * that has transform / filter / backdrop-filter / contain, not the
         * viewport, so a tooltip inside a frosted card would land in the wrong
         * place. The top layer escapes all of that. These resets undo the UA
         * popover box (centred by inset:0 + margin:auto, plus a default border)
         * so floating-ui's own coordinates win; autoUpdate keeps it glued to
         * the anchor while scrolling.
         */
        position: fixed;
        inset: auto;
        margin: 0;
        border: 0;
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
        box-shadow: var(--fluid-tooltip-shadow, var(--fluid-shadow-md));
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

  /** Placement relative to the anchor. */
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
  private pointerInside = false;
  private focusInside = false;
  private presented = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.listen(this, "pointerover", this.handlePointerOver);
    this.listen(this, "pointerleave", this.handlePointerLeave);
    this.listen(this, "focusin", this.handleFocusIn);
    this.listen(this, "focusout", this.handleFocusOut);
    this.listen(this, "keydown", this.handleKeyDown);
    if (this.hasUpdated) this.attachAnchor();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    this.cleanupPosition?.();
    this.cleanupPosition = undefined;
    this.pointerInside = false;
    this.focusInside = false;
    this.presented = false;
    this.visible = false;
    this.detachAnchor();
  }

  protected override firstUpdated(): void {
    this.attachAnchor();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("open") && this.open && this.visible) this.visible = false;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.show();
      else this.hide();
    }
    if (changed.has("disabled") && this.disabled) {
      this.open = false;
      this.hide(true);
    }
  }

  private attachAnchor(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot:not([name])");
    const slotted = slot?.assignedElements({ flatten: true });
    const next = slotted?.[0] as HTMLElement | undefined;
    if (next === this.anchor) return;
    const wasPresented = this.presented;
    this.cleanupPosition?.();
    this.cleanupPosition = undefined;
    this.detachAnchor();
    this.anchor = next;
    if (!this.anchor) {
      if (this.open) this.open = false;
      this.hide(true);
      return;
    }
    const existing = this.anchor.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
    if (!existing.includes(this.tooltipId)) {
      this.anchor.setAttribute(
        "aria-describedby",
        [...existing, this.tooltipId].filter(Boolean).join(" ")
      );
    }
    if (wasPresented) this.startPositioning();
    else if (this.open) void this.show();
  }

  private detachAnchor(): void {
    if (!this.anchor) return;
    const existing = (this.anchor.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((id) => id && id !== this.tooltipId);
    if (existing.length) this.anchor.setAttribute("aria-describedby", existing.join(" "));
    else this.anchor.removeAttribute("aria-describedby");
    this.anchor = undefined;
  }

  private handlePointerOver = () => {
    this.pointerInside = true;
    this.scheduleShow();
  };
  private handlePointerLeave = () => {
    this.pointerInside = false;
    this.scheduleHideIfInactive();
  };
  private handleFocusIn = () => {
    this.focusInside = true;
    this.scheduleShow();
  };
  private handleFocusOut = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) return;
    this.focusInside = false;
    this.scheduleHideIfInactive();
  };
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || this.open) return;
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    e.stopPropagation();
    this.hide();
  };

  private scheduleShow(): void {
    if (this.disabled) return;
    clearTimeout(this.hideTimer);
    clearTimeout(this.showTimer);
    if (this.presented) return;
    this.showTimer = setTimeout(() => this.show(), this.showDelay);
  }

  private scheduleHide(delay = this.hideDelay): void {
    if (this.open) return;
    clearTimeout(this.showTimer);
    if (!this.presented) return;
    this.hideTimer = setTimeout(() => this.hide(), delay);
  }

  private scheduleHideIfInactive(): void {
    if (!this.pointerInside && !this.focusInside) this.scheduleHide();
  }

  private async show(): Promise<void> {
    if (this.presented || !this.anchor || this.disabled) return;
    this.presented = true;
    if (!this.open) {
      this.visible = true;
      await this.updateComplete;
    }
    this.startPositioning();
    await this.reposition();
    this.dispatchEvent(
      new CustomEvent<null>("fluid-show", { detail: null, bubbles: true, composed: true })
    );
  }

  private hide(force = false): void {
    if (!this.presented || (this.open && !force)) return;
    this.presented = false;
    if (this.visible) this.visible = false;
    this.cleanupPosition?.();
    this.cleanupPosition = undefined;
    const popover = this.popoverEl as HTMLElement & { hidePopover?: () => void };
    try {
      popover?.hidePopover?.();
    } catch {
      /* not shown, ignore */
    }
    this.dispatchEvent(
      new CustomEvent<null>("fluid-hide", { detail: null, bubbles: true, composed: true })
    );
  }

  private startPositioning(): void {
    if (!this.anchor || !this.popoverEl || !this.presented) return;
    // Promote to the top layer before measuring: a hidden popover has no box,
    // and this is also what lifts it out of any transformed/filtered ancestor.
    const popover = this.popoverEl as HTMLElement & { showPopover?: () => void };
    try {
      popover.showPopover?.();
    } catch {
      /* already shown or unsupported, ignore */
    }
    this.cleanupPosition?.();
    this.cleanupPosition = autoUpdate(this.anchor, this.popoverEl, () => void this.reposition());
    void this.reposition();
  }

  private async reposition(): Promise<void> {
    if (!this.anchor || !this.popoverEl) return;
    const { x, y } = await computePosition(this.anchor, this.popoverEl, {
      placement: this.placement,
      strategy: "fixed",
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
        popover="manual"
        class="popover ${this.open || this.visible ? "visible" : ""}"
        role="tooltip"
        aria-hidden=${this.open || this.visible ? "false" : "true"}
      >
        <slot name="content">${this.content}</slot>
      </div>
    `;
  }
}
