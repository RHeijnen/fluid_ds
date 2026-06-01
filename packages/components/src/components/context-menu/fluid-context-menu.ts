import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { reducedMotion } from "../../internal/motion.js";
import { FluidElement } from "../../internal/base-element.js";
import "../menu/define.js";

type FluidMenuElement = HTMLElement & {
  focus(options?: FocusOptions): void;
  ariaLabel: string | null;
};

/** A single entry in the `items` array. */
export interface FluidContextMenuItem {
  /** Visible label. */
  label: string;
  /** Value carried by `fluid-select` when this entry is chosen. */
  value: string;
  /** Whether the entry is non-actionable. */
  disabled?: boolean;
  /** Render a separator before this entry instead of an item. */
  divider?: boolean;
}

/**
 * A right-click (and Shift+F10) context menu. It wraps a `trigger` slot and, on
 * `contextmenu` (or the keyboard context-menu gesture), opens a menu in the top
 * layer positioned at the pointer. It reuses the `<fluid-menu>` family for the
 * APG Menu pattern: `role="menu"`, `role="menuitem"` children, roving focus,
 * arrow-key navigation, type-ahead, Home/End, and Enter/Space activation.
 *
 * The surface is rendered with the native `popover` API (`popover="manual"`) so
 * it lives in the top layer and is never clipped by an `overflow: hidden`
 * ancestor. Focus moves into the menu on open and returns to the triggering
 * element on close. Escape, an outside pointer press, or selecting an item all
 * close the menu.
 *
 * Provide entries either as the `items` array (objects with `label` / `value`,
 * optional `disabled` and `divider`) or via the `menu` slot for full control
 * (slot in your own `<fluid-menu>` markup).
 *
 * @summary Right-click context menu following the APG Menu pattern.
 *
 * @slot trigger - The element the context menu is attached to. Required. A
 *   right-click (or Shift+F10 / the ContextMenu key while focused) opens the menu.
 * @slot menu - Optional custom menu markup (a `<fluid-menu>` with
 *   `<fluid-menu-item>` children). When present it overrides the `items` array.
 *
 * @csspart base - The popover surface that holds the menu.
 * @csspart menu - The inner `<fluid-menu>` surface (when using the `items` array).
 *
 * Every styled property reads a component-scoped `--fluid-context-menu-*` token
 * that falls back to a main semantic var or to the menu's own token (the
 * override ladder). Most styling delegates to the underlying `<fluid-menu>`.
 *
 * @cssproperty --fluid-context-menu-bg - Surface background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-context-menu-border - Surface border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-context-menu-border-width - Surface border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-context-menu-radius - Surface corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-context-menu-shadow - Surface elevation. Falls back to --fluid-shadow-lg.
 * @cssproperty --fluid-context-menu-min-width - Minimum surface width. Falls back to 12rem.
 *
 * @uses-token --fluid-surface-base - Surface background.
 * @uses-token --fluid-border-default - Surface border.
 * @uses-token --fluid-field-border-width - Surface border width.
 * @uses-token --fluid-radius-md - Surface corner radius.
 * @uses-token --fluid-shadow-lg - Surface elevation.
 * @uses-token --fluid-duration-fast - Open transition duration.
 * @uses-token --fluid-easing-standard - Open transition easing.
 *
 * @fires fluid-select - Fired when a menu entry is activated. `event.detail.value`
 *   carries the chosen value. Bubbles and is composed.
 * @fires fluid-show - Fired when the menu opens.
 * @fires fluid-hide - Fired when the menu closes.
 */
export class FluidContextMenu extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: contents;
      }

      .surface {
        position: fixed;
        margin: 0;
        padding: 0;
        border: 0;
        background: transparent;
        inset: auto;
        overflow: visible;
      }

      .surface:not(:popover-open) {
        display: none;
      }

      .menu {
        --fluid-menu-bg: var(--fluid-context-menu-bg, var(--fluid-surface-base));
        --fluid-menu-border: var(--fluid-context-menu-border, var(--fluid-border-default));
        --fluid-menu-border-width: var(
          --fluid-context-menu-border-width,
          var(--fluid-field-border-width)
        );
        --fluid-menu-radius: var(--fluid-context-menu-radius, var(--fluid-radius-md));
        --fluid-menu-shadow: var(--fluid-context-menu-shadow, var(--fluid-shadow-lg));
        --fluid-menu-min-width: var(--fluid-context-menu-min-width, 12rem);
        opacity: 0;
        transform: scale(0.97);
        transform-origin: top left;
        transition:
          opacity var(--fluid-duration-fast) var(--fluid-easing-standard),
          transform var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      .surface:popover-open .menu {
        opacity: 1;
        transform: scale(1);
      }
    `
  ];

  @query(".surface") private surfaceEl!: HTMLElement;

  /** Resolve the active menu: the slotted custom menu or the internal one. */
  private getMenu(): FluidMenuElement | null {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name='menu']");
    const slotted = slot
      ?.assignedElements({ flatten: true })
      .find((el): el is HTMLElement => el.tagName.toLowerCase() === "fluid-menu");
    if (slotted) return slotted as FluidMenuElement;
    return (this.shadowRoot?.querySelector("fluid-menu") as FluidMenuElement | null) ?? null;
  }

  /**
   * Menu entries. Each is `{ label, value, disabled?, divider? }`. Ignored when
   * the `menu` slot has content. Accepts an array property or a JSON string
   * attribute.
   */
  @property({ type: Array }) items: FluidContextMenuItem[] = [];

  /** Accessible label for the menu surface. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  /** Disable the context menu (right-click falls through to the browser default). */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Whether the menu is currently open. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** True when the `menu` slot has assigned content. */
  @state() private hasCustomMenu = false;

  private trigger: HTMLElement | null = null;
  private previouslyFocused: HTMLElement | null = null;
  private anchorX = 0;
  private anchorY = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.handleOutsidePointer, true);
    document.addEventListener("keydown", this.handleDocumentKeyDown, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.handleOutsidePointer, true);
    document.removeEventListener("keydown", this.handleDocumentKeyDown, true);
    this.detachTrigger();
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

  /** Open the menu at the given viewport coordinates. */
  showAt(x: number, y: number): void {
    if (this.disabled || this.open) return;
    this.anchorX = x;
    this.anchorY = y;
    this.open = true;
  }

  /** Close the menu. */
  hide(): void {
    if (!this.open) return;
    this.open = false;
  }

  private attachTrigger(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name='trigger']");
    const slotted = slot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    if (!slotted || slotted === this.trigger) return;
    this.detachTrigger();
    this.trigger = slotted;
    this.trigger.addEventListener("contextmenu", this.handleContextMenu);
    this.trigger.addEventListener("keydown", this.handleTriggerKeyDown);
    this.trigger.setAttribute("aria-haspopup", "menu");
  }

  private detachTrigger(): void {
    if (!this.trigger) return;
    this.trigger.removeEventListener("contextmenu", this.handleContextMenu);
    this.trigger.removeEventListener("keydown", this.handleTriggerKeyDown);
    this.trigger = null;
  }

  private handleContextMenu = (e: MouseEvent) => {
    if (this.disabled) return;
    e.preventDefault();
    this.showAt(e.clientX, e.clientY);
  };

  private handleTriggerKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    // Shift+F10 and the dedicated ContextMenu key are the keyboard equivalents
    // of a right-click (SC 2.1.1: every pointer action has a keyboard path).
    const isContextKey = e.key === "ContextMenu" || (e.shiftKey && e.key === "F10");
    if (!isContextKey) return;
    e.preventDefault();
    const rect = (this.trigger ?? this).getBoundingClientRect();
    this.showAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  private handleOpen(): void {
    this.previouslyFocused = (this.getRootNode() as Document).activeElement as HTMLElement | null;
    const surface = this.surfaceEl;
    if (!surface) return;
    if (typeof surface.showPopover === "function" && !surface.matches(":popover-open")) {
      surface.showPopover();
    }
    this.positionSurface();
    if (this.trigger) this.trigger.setAttribute("aria-expanded", "true");
    // Focus the menu after the surface paints in the top layer.
    requestAnimationFrame(() => {
      this.positionSurface();
      this.getMenu()?.focus();
    });
    this.dispatchEvent(new CustomEvent("fluid-show", { bubbles: true, composed: true }));
  }

  private handleClose(): void {
    const surface = this.surfaceEl;
    if (surface && typeof surface.hidePopover === "function" && surface.matches(":popover-open")) {
      surface.hidePopover();
    }
    if (this.trigger) this.trigger.setAttribute("aria-expanded", "false");
    // Return focus to the trigger (or whatever held it) on close.
    const restore = this.previouslyFocused ?? this.trigger;
    restore?.focus();
    this.previouslyFocused = null;
    this.dispatchEvent(new CustomEvent("fluid-hide", { bubbles: true, composed: true }));
  }

  /** Clamp the surface within the viewport, flipping when it would overflow. */
  private positionSurface(): void {
    const surface = this.surfaceEl;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = this.anchorX;
    let top = this.anchorY;
    if (left + rect.width + pad > vw) left = Math.max(pad, this.anchorX - rect.width);
    if (top + rect.height + pad > vh) top = Math.max(pad, this.anchorY - rect.height);
    surface.style.left = `${Math.max(pad, left)}px`;
    surface.style.top = `${Math.max(pad, top)}px`;
  }

  private handleSelect = (e: Event) => {
    // fluid-select already bubbles up from the menu; close on activation. We do
    // not re-dispatch (it bubbles through this host composed already).
    if ((e as CustomEvent).detail) this.hide();
  };

  private handleOutsidePointer = (e: PointerEvent) => {
    if (!this.open) return;
    const path = e.composedPath();
    if (path.includes(this.surfaceEl)) return;
    this.hide();
  };

  private handleDocumentKeyDown = (e: KeyboardEvent) => {
    if (this.open && e.key === "Escape") {
      e.stopPropagation();
      this.hide();
    }
  };

  private handleMenuSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    this.hasCustomMenu = slot.assignedElements({ flatten: true }).length > 0;
  };

  private renderItems(): TemplateResult {
    return html`
      <fluid-menu class="menu" part="menu" aria-label=${this.ariaLabel ?? "Context menu"}>
        ${this.items.map((item) =>
          item.divider
            ? html`<fluid-menu-label></fluid-menu-label>`
            : html`<fluid-menu-item
                value=${item.value}
                ?disabled=${item.disabled ?? false}
                >${item.label}</fluid-menu-item
              >`
        )}
      </fluid-menu>
    `;
  }

  override render(): TemplateResult {
    return html`
      <slot name="trigger" @slotchange=${() => this.attachTrigger()}></slot>
      <div
        part="base"
        class="surface"
        popover="manual"
        @fluid-select=${this.handleSelect}
      >
        <slot name="menu" @slotchange=${this.handleMenuSlotChange}></slot>
        ${this.hasCustomMenu ? "" : this.renderItems()}
      </div>
    `;
  }
}
