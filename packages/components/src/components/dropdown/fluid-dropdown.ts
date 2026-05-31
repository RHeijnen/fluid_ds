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
import type { FluidDropdownItem } from "./fluid-dropdown-item.js";

let counter = 0;

/**
 * A menu of selectable items, triggered by clicking an anchor element.
 * Implements the WAI-ARIA menu pattern: roving keyboard focus via the
 * `aria-activedescendant` model, full arrow-key navigation, type-ahead,
 * Escape to close.
 *
 * @summary Click-triggered menu of selectable items.
 *
 * @slot trigger - The element that toggles the dropdown. Required.
 * @slot - One or more `<fluid-dropdown-item>` (or separators).
 *
 * @csspart base - The outer container.
 * @csspart menu - The menu panel.
 *
 * @cssproperty --fluid-dropdown-bg - Menu background color. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-dropdown-border - Menu border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-dropdown-border-width - Menu border width. Falls back to 1px.
 * @cssproperty --fluid-dropdown-radius - Menu corner radius. Falls back to --fluid-radius-md.
 *
 * @uses-token --fluid-surface-base - Default menu background.
 * @uses-token --fluid-border-default - Default menu border.
 * @uses-token --fluid-border-strong - Scrollbar thumb color.
 * @uses-token --fluid-radius-md - Default menu corner radius.
 * @uses-token --fluid-shadow-lg - Menu elevation.
 *
 * @fires fluid-select - Fired when an item is selected. detail.value, detail.item.
 * @fires fluid-show - Fired when the menu opens.
 * @fires fluid-hide - Fired when the menu closes.
 */
export class FluidDropdown extends FluidElement {
  static override styles = css`
    :host {
      display: contents;
    }

    /*
     * Menu panel. Shares the design language of the select / typeahead
     * listboxes (same surface, border, shadow-lg, padding, and the thin
     * styled scrollbar) so every popover menu in the system reads as one
     * family. Unlike those comboboxes the menu does NOT fuse to its trigger
     *, a button-triggered menu is a detached floating panel by convention:
     * so it keeps all four corners + a small subtle pop on open.
     *
     * The menu renders in the browser TOP LAYER via the Popover API
     * (popover="manual" + showPopover/hidePopover). That's what guarantees it
     * paints above ALL app chrome and escapes every clipping / stacking
     * context, a plain position:fixed + z-index can still be clipped by a
     * fixed-containing-block ancestor or sit under a sticky sidebar (this bit
     * the split-button menu in the docs: it disappeared behind the nav pane).
     * The top layer has no such failure mode. position:fixed + the floating-ui
     * coords still drive placement; z-index is a harmless fallback.
     */
    .menu {
      position: fixed;
      /* Override the UA popover defaults (inset: 0; margin: auto) so our
         floating-ui left/top win. */
      inset: auto;
      margin: 0;
      top: 0;
      left: 0;
      z-index: 1000;
      box-sizing: border-box;
      min-width: 12rem;
      max-height: 18rem;
      /* hidden auto, never a horizontal scrollbar, only a vertical one when
         content overflows max-height (matches the select listbox). */
      overflow: hidden auto;
      scrollbar-width: thin;
      scrollbar-color: var(--fluid-border-strong, color-mix(in srgb, currentColor 25%, transparent))
        transparent;
      padding: var(--fluid-space-1);
      background: var(--fluid-dropdown-bg, var(--fluid-surface-base));
      border: var(--fluid-dropdown-border-width, 1px) solid
        var(--fluid-dropdown-border, var(--fluid-border-default));
      border-radius: var(--fluid-dropdown-radius, var(--fluid-radius-md));
      box-shadow: var(--fluid-shadow-lg);
      opacity: 0;
      transform: scale(0.97);
      transform-origin: top left;
      /* allow-discrete lets the panel animate in/out even though the popover
         toggles display between none/block in the top layer. */
      transition:
        opacity var(--fluid-duration-fast) var(--fluid-easing-standard),
        transform var(--fluid-duration-fast) var(--fluid-easing-standard),
        overlay var(--fluid-duration-fast) allow-discrete,
        display var(--fluid-duration-fast) allow-discrete;
    }

    /* Styled vertical scrollbar so the rare overflow case still feels
       designed instead of falling back to the OS default, identical to
       the select / typeahead listboxes. */
    .menu::-webkit-scrollbar {
      width: 8px;
    }
    .menu::-webkit-scrollbar-track {
      background: transparent;
    }
    .menu::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, currentColor 22%, transparent);
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    .menu::-webkit-scrollbar-thumb:hover {
      background: color-mix(in srgb, currentColor 36%, transparent);
      background-clip: padding-box;
    }

    .menu:popover-open {
      opacity: 1;
      transform: scale(1);
    }

    /* Entry animation start state for the top-layer transition. */
    @starting-style {
      .menu:popover-open {
        opacity: 0;
        transform: scale(0.97);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .menu {
        transition-duration: 0s;
        transform: none;
      }
    }
  `;

  @query(".menu") private menuEl!: HTMLElement;

  /** Open state. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Placement of the menu relative to the trigger. */
  @property() placement: Placement = "bottom-start";

  /** Distance (px) between trigger and menu. */
  @property({ type: Number }) distance = 4;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  private trigger: HTMLElement | null = null;
  private cleanup?: () => void;
  private menuId = `fluid-dropdown-menu-${++counter}`;
  private typeaheadBuffer = "";
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.handleOutsideClick, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.handleOutsideClick, true);
    this.cleanup?.();
    clearTimeout(this.typeaheadTimer);
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

  show(): void {
    if (this.disabled || this.open) return;
    this.open = true;
  }
  hide(): void {
    if (!this.open) return;
    this.open = false;
  }
  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
  }

  private getItems(): FluidDropdownItem[] {
    return Array.from(
      this.querySelectorAll<HTMLElement>("fluid-dropdown-item")
    ).filter((el) => el.getAttribute("type") !== "separator") as FluidDropdownItem[];
  }

  private getEnabledItems(): FluidDropdownItem[] {
    return this.getItems().filter((it) => !it.disabled);
  }

  private attachTrigger(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name='trigger']");
    const slotted = slot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    if (!slotted) return;
    if (this.trigger !== slotted) {
      this.trigger?.removeEventListener("click", this.handleTriggerClick);
      this.trigger?.removeEventListener("keydown", this.handleTriggerKey);
      this.trigger = slotted;
      this.trigger.addEventListener("click", this.handleTriggerClick);
      this.trigger.addEventListener("keydown", this.handleTriggerKey);
      this.trigger.setAttribute("aria-haspopup", "menu");
      this.trigger.setAttribute("aria-controls", this.menuId);
    }
    this.trigger.setAttribute("aria-expanded", this.open ? "true" : "false");
  }

  private async handleOpen(): Promise<void> {
    if (!this.trigger || !this.menuEl) return;
    this.trigger.setAttribute("aria-expanded", "true");
    // Promote the menu into the browser top layer so it paints above all app
    // chrome and escapes every clipping / stacking context. Guarded: throws if
    // already open or if the API is unavailable (very old browsers degrade to
    // the position:fixed + z-index fallback).
    this.showMenuPopover();
    this.cleanup = autoUpdate(this.trigger, this.menuEl, () => this.reposition());
    await this.reposition();
    // Focus the first enabled item so arrow keys work immediately.
    requestAnimationFrame(() => {
      const items = this.getEnabledItems();
      if (items[0]) this.setActiveIndex(0);
      this.menuEl.focus();
    });
    this.dispatchEvent(new CustomEvent("fluid-show", { bubbles: true, composed: true }));
  }

  private handleClose(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    this.hideMenuPopover();
    if (this.trigger) {
      this.trigger.setAttribute("aria-expanded", "false");
      (this.trigger as HTMLElement).focus();
    }
    this.clearActive();
    this.dispatchEvent(new CustomEvent("fluid-hide", { bubbles: true, composed: true }));
  }

  /** Show the menu in the top layer. No-ops if unsupported or already shown. */
  private showMenuPopover(): void {
    const menu = this.menuEl as HTMLElement & { showPopover?: () => void };
    if (typeof menu.showPopover !== "function") return;
    try {
      menu.showPopover();
    } catch {
      /* already open or not connected, ignore */
    }
  }

  /** Remove the menu from the top layer. No-ops if unsupported or not shown. */
  private hideMenuPopover(): void {
    const menu = this.menuEl as HTMLElement & { hidePopover?: () => void };
    if (typeof menu?.hidePopover !== "function") return;
    try {
      menu.hidePopover();
    } catch {
      /* not currently open, ignore */
    }
  }

  private async reposition(): Promise<void> {
    if (!this.trigger || !this.menuEl) return;
    const { x, y } = await computePosition(this.trigger, this.menuEl, {
      placement: this.placement,
      strategy: "fixed",
      middleware: [
        offset(this.distance),
        flip({ boundary: "clippingAncestors", rootBoundary: "viewport" }),
        shift({ padding: 8 })
      ]
    });
    Object.assign(this.menuEl.style, { left: `${x}px`, top: `${y}px` });
  }

  private get activeIndex(): number {
    return this.getEnabledItems().findIndex((it) => it.active);
  }

  private setActiveIndex(idx: number): void {
    const items = this.getEnabledItems();
    items.forEach((it, i) => (it.active = i === idx));
    items[idx]?.scrollIntoView({ block: "nearest" });
    if (items[idx]) this.menuEl.setAttribute("aria-activedescendant", items[idx].id);
  }

  private clearActive(): void {
    for (const it of this.getItems()) it.active = false;
    this.menuEl?.removeAttribute("aria-activedescendant");
  }

  private moveActive(delta: number): void {
    const n = this.getEnabledItems().length;
    if (!n) return;
    const next = (this.activeIndex + delta + n) % n;
    this.setActiveIndex(next);
  }

  private commitItem(item: FluidDropdownItem): void {
    if (item.disabled) return;
    if (item.type === "checkbox") {
      item.checked = !item.checked;
    }
    this.dispatchEvent(
      new CustomEvent("fluid-select", {
        detail: { value: item.value, item },
        bubbles: true,
        composed: true
      })
    );
    if (item.type !== "checkbox") this.hide();
  }

  private typeahead(char: string): void {
    this.typeaheadBuffer += char.toLowerCase();
    clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => (this.typeaheadBuffer = ""), 500);
    const items = this.getEnabledItems();
    const idx = items.findIndex((it) =>
      (it.textContent ?? "").trim().toLowerCase().startsWith(this.typeaheadBuffer)
    );
    if (idx >= 0) this.setActiveIndex(idx);
  }

  private handleTriggerClick = (e: Event) => {
    if (this.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    this.toggle();
  };

  private handleTriggerKey = (e: KeyboardEvent) => {
    if (this.disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.show();
    }
  };

  private handleMenuKey = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.moveActive(1);
        return;
      case "ArrowUp":
        e.preventDefault();
        this.moveActive(-1);
        return;
      case "Home":
        e.preventDefault();
        this.setActiveIndex(0);
        return;
      case "End":
        e.preventDefault();
        this.setActiveIndex(this.getEnabledItems().length - 1);
        return;
      case "Enter":
      case " ": {
        e.preventDefault();
        const items = this.getEnabledItems();
        const active = items[this.activeIndex];
        if (active) this.commitItem(active);
        return;
      }
      case "Escape":
        e.preventDefault();
        this.hide();
        return;
      case "Tab":
        this.hide();
        return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      this.typeahead(e.key);
    }
  };

  private handleMenuClick = (e: Event) => {
    const item = (e.target as HTMLElement).closest("fluid-dropdown-item") as FluidDropdownItem | null;
    if (!item) return;
    this.commitItem(item);
  };

  private handleMenuHover = (e: Event) => {
    const item = (e.target as HTMLElement).closest("fluid-dropdown-item") as FluidDropdownItem | null;
    if (!item) return;
    const items = this.getEnabledItems();
    const idx = items.indexOf(item);
    if (idx >= 0) this.setActiveIndex(idx);
  };

  private handleOutsideClick = (e: PointerEvent) => {
    if (!this.open) return;
    const path = e.composedPath();
    if (path.includes(this) || (this.trigger && path.includes(this.trigger))) return;
    this.hide();
  };

  override render(): TemplateResult {
    return html`
      <slot name="trigger" @slotchange=${() => this.attachTrigger()}></slot>
      <div
        part="menu"
        class="menu"
        id=${this.menuId}
        role="menu"
        tabindex="-1"
        popover="manual"
        @click=${this.handleMenuClick}
        @keydown=${this.handleMenuKey}
        @pointermove=${this.handleMenuHover}
      >
        <slot></slot>
      </div>
    `;
  }
}
