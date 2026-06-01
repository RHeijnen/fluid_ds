import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { reducedMotion } from "../../internal/motion.js";
import { FluidElement } from "../../internal/base-element.js";

type FluidMenuItemElement = HTMLElement & {
  value: string;
  disabled: boolean;
  active: boolean;
};

/**
 * A presentational menu surface implementing the WAI-ARIA APG Menu pattern.
 *
 * The container is `role="menu"`; its `<fluid-menu-item>` children are
 * `role="menuitem"`. Focus is managed with a roving tabindex: exactly one item
 * is in the tab order at a time, arrow keys move the active item, and the menu
 * itself is not focusable. This is a single-level menu, submenus are out of
 * scope.
 *
 * Positioning and the trigger are the consumer's job (or `fluid-dropdown`); this
 * element only renders the list surface and owns keyboard navigation. Activating
 * an item fires `fluid-select` from the item (bubbling) and from the menu.
 *
 * Keyboard (APG Menu): ArrowDown/ArrowUp move between items (wrapping), Home/End
 * jump to first/last, Enter/Space activate the active item, and printable
 * characters type-ahead to the next matching item. Disabled items are skipped.
 *
 * @summary A list of actions following the APG Menu pattern.
 *
 * @slot - One or more `<fluid-menu-item>` elements, optionally separated by
 *   `<fluid-menu-label>` group headings.
 *
 * @csspart base - The `role="menu"` surface.
 *
 * Every styled property reads a component-scoped `--fluid-menu-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-menu-bg - Surface background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-menu-border - Surface border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-menu-border-width - Surface border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-menu-radius - Surface corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-menu-shadow - Surface elevation. Falls back to --fluid-shadow-lg.
 * @cssproperty --fluid-menu-padding - Inner padding around the items. Falls back to --fluid-space-1.
 * @cssproperty --fluid-menu-min-width - Minimum surface width. Falls back to 12rem.
 *
 * @uses-token --fluid-surface-base - Surface background.
 * @uses-token --fluid-border-default - Surface border.
 * @uses-token --fluid-border-strong - Scrollbar thumb.
 * @uses-token --fluid-field-border-width - Surface border width.
 * @uses-token --fluid-radius-md - Surface corner radius.
 * @uses-token --fluid-shadow-lg - Surface elevation.
 * @uses-token --fluid-space-1 - Inner padding.
 *
 * @fires fluid-select - Fired when an item is activated. `event.detail.value`
 *   carries the item's `value`. Bubbles and is composed.
 */
export class FluidMenu extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        min-width: var(--fluid-menu-min-width, 12rem);
        max-height: 18rem;
        overflow: hidden auto;
        scrollbar-width: thin;
        scrollbar-color: var(
            --fluid-border-strong,
            color-mix(in srgb, currentColor 25%, transparent)
          )
          transparent;
        background: var(--fluid-menu-bg, var(--fluid-surface-base));
        border: var(--fluid-menu-border-width, var(--fluid-field-border-width)) solid
          var(--fluid-menu-border, var(--fluid-border-default));
        border-radius: var(--fluid-menu-radius, var(--fluid-radius-md));
        box-shadow: var(--fluid-menu-shadow, var(--fluid-shadow-lg));
        padding: var(--fluid-menu-padding, var(--fluid-space-1));
        outline: none;
      }

      .base::-webkit-scrollbar {
        width: 8px;
      }
      .base::-webkit-scrollbar-track {
        background: transparent;
      }
      .base::-webkit-scrollbar-thumb {
        background: color-mix(in srgb, currentColor 22%, transparent);
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .base::-webkit-scrollbar-thumb:hover {
        background: color-mix(in srgb, currentColor 36%, transparent);
        background-clip: padding-box;
      }
    `
  ];

  /** Accessible label for the menu. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  private typeaheadBuffer = "";
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("pointermove", this.handlePointerMove);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("pointermove", this.handlePointerMove);
    clearTimeout(this.typeaheadTimer);
  }

  /** All non-disabled-aware menu item children, in DOM order. */
  private getItems(): FluidMenuItemElement[] {
    return Array.from(this.querySelectorAll<FluidMenuItemElement>("fluid-menu-item"));
  }

  private getEnabledItems(): FluidMenuItemElement[] {
    return this.getItems().filter((i) => !i.disabled);
  }

  private get activeItem(): FluidMenuItemElement | undefined {
    return this.getItems().find((i) => i.active);
  }

  /** Move focus to the first enabled item (used by a trigger on open). */
  override focus(options?: FocusOptions): void {
    const items = this.getEnabledItems();
    const target = this.activeItem ?? items[0];
    if (target) {
      this.setActive(target);
      target.focus(options);
    }
  }

  /** Focus the last enabled item (a Menu Button opens here on ArrowUp). */
  focusLast(options?: FocusOptions): void {
    const items = this.getEnabledItems();
    const target = items[items.length - 1];
    if (target) {
      this.setActive(target);
      target.focus(options);
    }
  }

  protected override firstUpdated(): void {
    // Seed the roving tabindex so the first enabled item is the single tab stop.
    this.resetRovingTabindex();
  }

  private resetRovingTabindex(): void {
    const items = this.getItems();
    const firstEnabled = items.find((i) => !i.disabled);
    for (const item of items) {
      item.tabIndex = item === firstEnabled ? 0 : -1;
      item.active = false;
    }
  }

  private setActive(item: FluidMenuItemElement): void {
    for (const i of this.getItems()) {
      const isActive = i === item;
      i.active = isActive;
      i.tabIndex = isActive ? 0 : -1;
    }
    item.scrollIntoView({ block: "nearest" });
  }

  private moveBy(delta: number): void {
    const items = this.getItems();
    if (!items.length) return;
    const current = this.activeItem;
    let index = current ? items.indexOf(current) : delta > 0 ? -1 : 0;
    const seen = new Set<number>();
    do {
      index = (index + delta + items.length) % items.length;
      if (seen.has(index)) return;
      seen.add(index);
    } while (items[index]?.disabled);
    const next = items[index];
    if (next) {
      this.setActive(next);
      next.focus();
    }
  }

  private moveToEdge(toLast: boolean): void {
    const items = this.getEnabledItems();
    const target = toLast ? items[items.length - 1] : items[0];
    if (target) {
      this.setActive(target);
      target.focus();
    }
  }

  private typeahead(char: string): void {
    this.typeaheadBuffer += char.toLowerCase();
    clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => (this.typeaheadBuffer = ""), 500);
    const items = this.getItems();
    const match = items.find(
      (i) => !i.disabled && i.textContent?.trim().toLowerCase().startsWith(this.typeaheadBuffer)
    );
    if (match) {
      this.setActive(match);
      match.focus();
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.moveBy(1);
        return;
      case "ArrowUp":
        e.preventDefault();
        this.moveBy(-1);
        return;
      case "Home":
        e.preventDefault();
        this.moveToEdge(false);
        return;
      case "End":
        e.preventDefault();
        this.moveToEdge(true);
        return;
      // Enter / Space activation is handled by the focused <fluid-menu-item>
      // itself (so an item also works standalone). We deliberately don't
      // re-handle it here to avoid firing fluid-select twice.
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      this.typeahead(e.key);
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    const item = (e.target as HTMLElement).closest(
      "fluid-menu-item"
    ) as FluidMenuItemElement | null;
    if (!item || item.disabled) return;
    if (item !== this.activeItem) this.setActive(item);
  };

  private handleSlotChange = () => {
    this.resetRovingTabindex();
  };

  override render(): TemplateResult {
    return html`
      <div
        part="base"
        class="base"
        role="menu"
        aria-label=${this.ariaLabel ?? "Menu"}
        @keydown=${this.handleKeyDown}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}
