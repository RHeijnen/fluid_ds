import { html, css, nothing, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidToolbarOrientation = "horizontal" | "vertical";

/**
 * Container for a related set of frequently-used controls (buttons, toggles,
 * links) that implements the WAI-ARIA Toolbar pattern. The toolbar is a single
 * Tab stop: it manages a roving `tabindex` across its focusable slotted controls
 * so Arrow keys move between them and Tab moves out of the toolbar entirely.
 * Home and End jump to the first and last control.
 *
 * Use a toolbar to group actions that operate on the same context (a text
 * editor's formatting controls, a media player's transport). Do not use it for
 * unrelated controls, and do not nest toolbars: neither is supported by the
 * pattern.
 *
 * Provide an accessible name with `aria-label` (or `aria-labelledby`) on the
 * host so assistive tech announces the group's purpose.
 *
 * @summary Roving-tabindex container for a related group of controls.
 *
 * @slot - The toolbar's controls (buttons, toggle buttons, links, menu buttons).
 *
 * @csspart base - The toolbar container element (`role="toolbar"`).
 *
 * @cssproperty --fluid-toolbar-gap - Gap between controls.
 * @cssproperty --fluid-toolbar-padding - Inner padding around the controls.
 * @cssproperty --fluid-toolbar-bg - Background color of the toolbar surface.
 * @cssproperty --fluid-toolbar-border - Border color of the toolbar surface.
 * @cssproperty --fluid-toolbar-radius - Corner radius of the toolbar surface.
 *
 * @uses-token --fluid-space-1 - Default gap between controls.
 * @uses-token --fluid-space-2 - Default inner padding.
 * @uses-token --fluid-surface-base - Default background.
 * @uses-token --fluid-border-default - Default border color.
 * @uses-token --fluid-radius-md - Default corner radius.
 */
export class FluidToolbar extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-toolbar-gap, var(--fluid-space-1));
      padding: var(--fluid-toolbar-padding, var(--fluid-space-2));
      background-color: var(--fluid-toolbar-bg, var(--fluid-surface-base));
      box-shadow: inset 0 0 0 1px
        var(--fluid-toolbar-border, var(--fluid-border-default));
      border-radius: var(--fluid-toolbar-radius, var(--fluid-radius-md));
    }

    .base.vertical {
      flex-direction: column;
      align-items: stretch;
    }
  `;

  /**
   * Layout orientation. Drives `aria-orientation` and which Arrow keys move
   * between controls: Left/Right when horizontal, Up/Down when vertical.
   */
  @property({ reflect: true }) orientation: FluidToolbarOrientation = "horizontal";

  @query(".base") private base!: HTMLDivElement;

  /**
   * Every managed control, in DOM order, including disabled ones. We keep the
   * disabled controls here so we can pull them out of the Tab order too: the
   * toolbar must be a single Tab stop, and a disabled native control still
   * defaults to `tabIndex` 0 unless we override it.
   */
  private controls: HTMLElement[] = [];

  /** The subset of {@link controls} that roving navigation can land on. */
  private get items(): HTMLElement[] {
    return this.controls.filter((el) => !this.isDisabled(el));
  }

  /**
   * Selector for the controls the toolbar manages. Covers native interactive
   * elements and Fluid controls that expose a focusable host. Items that are
   * disabled (native `disabled` or `aria-disabled="true"`) are skipped.
   */
  private static readonly FOCUSABLE_SELECTOR = [
    "button",
    "a[href]",
    "input",
    "select",
    "textarea",
    "[tabindex]",
    "fluid-button",
    "fluid-icon-button",
    "fluid-toggle",
    "fluid-switch",
    "fluid-checkbox"
  ].join(",");

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("keydown", this.handleKeydown);
    this.addEventListener("focusin", this.handleFocusin);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.handleKeydown);
    this.removeEventListener("focusin", this.handleFocusin);
  }

  /** Collect the slotted controls and apply the initial roving tabindex. */
  private handleSlotChange = (): void => {
    this.collectItems();
    this.resetTabIndex();
  };

  private collectItems(): void {
    const slot = this.base?.querySelector("slot");
    const assigned = slot
      ? (slot as HTMLSlotElement).assignedElements({ flatten: true })
      : [];
    const found: HTMLElement[] = [];
    for (const node of assigned) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches(FluidToolbar.FOCUSABLE_SELECTOR)) {
        found.push(node);
        continue;
      }
      // The focusable control may be nested inside a wrapper element.
      const nested = node.querySelector<HTMLElement>(
        FluidToolbar.FOCUSABLE_SELECTOR
      );
      if (nested) found.push(nested);
    }
    this.controls = found;
  }

  private isDisabled(el: HTMLElement): boolean {
    return (
      el.hasAttribute("disabled") ||
      el.getAttribute("aria-disabled") === "true"
    );
  }

  /**
   * Exactly one control is in the Tab order; the rest (including disabled
   * controls, which would otherwise default to `tabIndex` 0) are pulled out so
   * the whole toolbar is a single Tab stop. `activeIndex` indexes the enabled
   * {@link items}, so the tab stop never lands on a disabled control.
   */
  private resetTabIndex(activeIndex = 0): void {
    const active = this.items[activeIndex];
    for (const el of this.controls) {
      el.tabIndex = el === active ? 0 : -1;
    }
  }

  private get activeIndex(): number {
    const idx = this.items.findIndex((el) => el.tabIndex === 0);
    return idx === -1 ? 0 : idx;
  }

  private focusItem(index: number): void {
    const item = this.items[index];
    if (!item) return;
    this.resetTabIndex(index);
    item.focus();
  }

  /**
   * When focus enters a control (via click or Tab), make that control the
   * single tab stop so a later Tab leaves the toolbar from where the user was.
   */
  private handleFocusin = (event: FocusEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const index = this.items.indexOf(target);
    if (index >= 0) this.resetTabIndex(index);
  };

  private handleKeydown = (event: KeyboardEvent): void => {
    if (this.items.length === 0) return;
    const horizontal = this.orientation !== "vertical";
    const next = horizontal ? "ArrowRight" : "ArrowDown";
    const prev = horizontal ? "ArrowLeft" : "ArrowUp";

    const current = this.activeIndex;
    const last = this.items.length - 1;

    switch (event.key) {
      case next: {
        event.preventDefault();
        this.focusItem(current >= last ? 0 : current + 1);
        break;
      }
      case prev: {
        event.preventDefault();
        this.focusItem(current <= 0 ? last : current - 1);
        break;
      }
      case "Home": {
        event.preventDefault();
        this.focusItem(0);
        break;
      }
      case "End": {
        event.preventDefault();
        this.focusItem(last);
        break;
      }
      default:
        break;
    }
  };

  override render(): TemplateResult {
    // Forward the host's accessible name onto the element that carries
    // role="toolbar", so screen readers announce the group's purpose.
    const label = this.getAttribute("aria-label");
    const labelledby = this.getAttribute("aria-labelledby");
    return html`
      <div
        part="base"
        class="base ${this.orientation === "vertical" ? "vertical" : ""}"
        role="toolbar"
        aria-orientation=${this.orientation}
        aria-label=${label ?? nothing}
        aria-labelledby=${labelledby ?? nothing}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}
