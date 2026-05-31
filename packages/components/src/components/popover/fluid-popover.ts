import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type Placement
} from "@floating-ui/dom";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

/**
 * Click-triggered floating panel anchored to a trigger element. Useful for
 * menus, settings panels, and any contextual UI that needs to stay near
 * its trigger but be dismissible.
 *
 * Behavior:
 *  - Click the trigger to toggle open
 *  - Click outside or press Escape to close
 *  - Focus moves into the popover on open; restored to trigger on close
 *
 * @summary Click-anchored floating panel.
 *
 * @slot trigger - The element that toggles the popover. Required.
 * @slot - The popover content.
 *
 * @csspart base - The outer wrapper.
 * @csspart panel - The popover panel.
 *
 * Every styled property reads a component-scoped `--fluid-popover-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-popover-bg - Panel background color. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-popover-border - Panel border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-popover-border-width - Panel border width. Falls back to 1px.
 * @cssproperty --fluid-popover-fg - Panel text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-popover-radius - Panel corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-popover-font-family - Panel font family. Falls back to --fluid-font-family-sans.
 *
 * @uses-token --fluid-surface-base - Default panel background.
 * @uses-token --fluid-border-default - Default panel border.
 * @uses-token --fluid-text-primary - Default panel text.
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-shadow-lg - Panel elevation.
 *
 * @fires fluid-show - Fired when the popover becomes visible.
 * @fires fluid-hide - Fired when the popover is dismissed.
 */
export class FluidPopover extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
    :host {
      display: contents;
    }

    .panel {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      min-width: 12rem;
      max-width: 24rem;
      padding: var(--fluid-space-3) var(--fluid-space-4);
      background: var(--fluid-popover-bg, var(--fluid-surface-base));
      border: var(--fluid-popover-border-width, 1px) solid
        var(--fluid-popover-border, var(--fluid-border-default));
      border-radius: var(--fluid-popover-radius, var(--fluid-radius-md));
      box-shadow: var(--fluid-shadow-lg);
      font-family: var(--fluid-popover-font-family, var(--fluid-font-family-sans));
      color: var(--fluid-popover-fg, var(--fluid-text-primary));
      opacity: 0;
      visibility: hidden;
      transform: scale(0.97);
      transform-origin: top left;
      transition:
        opacity var(--fluid-duration-fast) var(--fluid-easing-standard),
        transform var(--fluid-duration-fast) var(--fluid-easing-standard),
        visibility 0s var(--fluid-duration-fast);
    }

    :host([open]) .panel {
      opacity: 1;
      visibility: visible;
      transform: scale(1);
      transition-delay: 0s;
    }
  `
  ];

  @query(".panel") private panelEl!: HTMLElement;

  /** Open state. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Floating-ui placement. */
  @property() placement: Placement = "bottom-start";

  /** Distance (px) between the trigger and the panel. */
  @property({ type: Number }) distance = 8;

  /** Cross-axis offset (px). */
  @property({ type: Number }) skidding = 0;

  /** Disable the popover (clicks on the trigger don't open it). */
  @property({ type: Boolean, reflect: true }) disabled = false;

  private trigger: HTMLElement | null = null;
  private cleanup?: () => void;
  private previouslyFocused: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.handleOutsideClick, true);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.handleOutsideClick, true);
    document.removeEventListener("keydown", this.handleKeyDown);
    this.cleanup?.();
  }

  protected override firstUpdated(): void {
    this.attachTrigger();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.handleOpen();
      else this.handleClose();
    }
  }

  /** Show the popover. */
  show(): void {
    if (this.disabled || this.open) return;
    this.open = true;
  }

  /** Hide the popover. */
  hide(): void {
    if (!this.open) return;
    this.open = false;
  }

  /** Toggle the popover. */
  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
  }

  private attachTrigger(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name='trigger']");
    const slotted = slot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    if (!slotted) return;
    if (this.trigger !== slotted) {
      this.trigger?.removeEventListener("click", this.handleTriggerClick);
      this.trigger = slotted;
      this.trigger.addEventListener("click", this.handleTriggerClick);
      // Wire ARIA, popover is described by its panel.
      if (!this.trigger.hasAttribute("aria-haspopup")) {
        this.trigger.setAttribute("aria-haspopup", "true");
      }
    }
    this.trigger.setAttribute("aria-expanded", this.open ? "true" : "false");
  }

  private async handleOpen(): Promise<void> {
    this.previouslyFocused = (this.getRootNode() as Document).activeElement as HTMLElement | null;
    if (!this.trigger || !this.panelEl) return;
    this.trigger.setAttribute("aria-expanded", "true");
    this.cleanup = autoUpdate(this.trigger, this.panelEl, () => this.reposition());
    await this.reposition();
    // Move focus into the popover after the panel paints.
    requestAnimationFrame(() => {
      const focusable = this.panelEl.querySelector<HTMLElement>(
        '[autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    });
    this.dispatchEvent(new CustomEvent("fluid-show", { bubbles: true, composed: true }));
  }

  private handleClose(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    if (this.trigger) this.trigger.setAttribute("aria-expanded", "false");
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
    this.dispatchEvent(new CustomEvent("fluid-hide", { bubbles: true, composed: true }));
  }

  private async reposition(): Promise<void> {
    if (!this.trigger || !this.panelEl) return;
    const { x, y } = await computePosition(this.trigger, this.panelEl, {
      placement: this.placement,
      strategy: "fixed",
      middleware: [
        offset({ mainAxis: this.distance, crossAxis: this.skidding }),
        flip({ boundary: "clippingAncestors", rootBoundary: "viewport" }),
        shift({ padding: 8 })
      ]
    });
    Object.assign(this.panelEl.style, { left: `${x}px`, top: `${y}px` });
  }

  private handleTriggerClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.toggle();
  };

  private handleOutsideClick = (e: PointerEvent) => {
    if (!this.open) return;
    const path = e.composedPath();
    if (path.includes(this) || (this.trigger && path.includes(this.trigger))) return;
    this.hide();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.open) {
      e.stopPropagation();
      this.hide();
    }
  };

  override render(): TemplateResult {
    return html`
      <slot name="trigger" @slotchange=${() => this.attachTrigger()}></slot>
      <div part="panel" class="panel" role="dialog">
        <slot></slot>
      </div>
    `;
  }
}
