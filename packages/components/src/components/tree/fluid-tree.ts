import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import type { FluidTreeItem } from "./fluid-tree-item.js";

/**
 * Hierarchical tree view. Children are `<fluid-tree-item>` elements,
 * nested arbitrarily deep. Implements the WAI-ARIA tree pattern: arrow
 * keys move between visible items, Right/Left expand/collapse, Home/End
 * jump to the first/last visible item, Enter activates.
 *
 * Coordinates selection so only one item is selected at a time and
 * propagates the current focus.
 *
 * @summary Hierarchical tree view.
 *
 * @slot - `<fluid-tree-item>` children.
 *
 * @csspart base - The tree container.
 *
 * @cssproperty --fluid-tree-fg - Default text color.
 *
 * @uses-token --fluid-text-primary - Default text color.
 *
 * @fires fluid-select - Fired when a tree item is activated; detail = { item }.
 */
export class FluidTree extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--fluid-tree-fg, var(--fluid-text-primary));
    }
  `;

  /** Initial selected node id (matches the item's `id` attribute). */
  @property({ attribute: "selected" }) initialSelected: string | null = null;

  private itemsObserver?: MutationObserver;
  private typeaheadBuffer = "";
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "tree");
    this.tabIndex = 0;
    this.listen(this, "keydown", this.onKeyDown);
    this.listen(this, "fluid-select", this.onItemSelect as EventListener);
    this.listen(this, "focus", this.onFocus);
    this.itemsObserver = new MutationObserver(() => this.syncTabStop());
    this.itemsObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["expanded", "disabled", "hidden"]
    });
    void this.updateComplete.then(() => {
      if (this.isConnected) this.syncTabStop();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.itemsObserver?.disconnect();
    this.itemsObserver = undefined;
    clearTimeout(this.typeaheadTimer);
    this.typeaheadBuffer = "";
  }

  protected override firstUpdated(): void {
    // Set levels for direct children (they'll cascade).
    for (const child of Array.from(this.children)) {
      if (child.tagName === "FLUID-TREE-ITEM") {
        (child as FluidTreeItem).level = 0;
      }
    }
    if (this.initialSelected) {
      const target = this.getItems().find((item) => item.id === this.initialSelected);
      if (target && !target.disabled) this.selectItem(target);
    }
  }

  /** All visible tree items in document order (collapsed branches excluded). */
  private getVisibleItems(): FluidTreeItem[] {
    const items: FluidTreeItem[] = [];
    const walk = (el: Element) => {
      for (const child of Array.from(el.children)) {
        if (child.tagName === "FLUID-TREE-ITEM") {
          const item = child as FluidTreeItem;
          if (item.disabled || item.hidden) continue;
          items.push(item);
          if (item.expanded) walk(item);
        }
      }
    };
    walk(this);
    return items;
  }

  /** Currently focused item, or null. */
  private focused(): FluidTreeItem | null {
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    return this.getItems().find((item) => item === active) ?? null;
  }

  private getItems(): FluidTreeItem[] {
    return Array.from(this.querySelectorAll<FluidTreeItem>("fluid-tree-item")).filter(
      (item) => item.closest("fluid-tree") === this
    );
  }

  private syncTabStop = (): void => {
    const visible = this.getVisibleItems();
    const focused = this.focused();
    let ancestor: HTMLElement | null = focused;
    while (ancestor && !visible.includes(ancestor as FluidTreeItem))
      ancestor = ancestor.parentElement;
    const target =
      (ancestor as FluidTreeItem | null) ??
      visible.find((item) => item.tabIndex === 0) ??
      visible.find((item) => item.selected) ??
      visible[0];
    // A negative tabindex on a shadow host removes its slotted descendants
    // from sequential focus navigation too. Let the item own the tab stop.
    if (target) this.removeAttribute("tabindex");
    else this.tabIndex = 0;
    this.setTabStop(target);
    if (focused && target && focused !== target) target.focus();
  };

  /** Move focus to a specific item, scrolling as needed. */
  private focusItem(item: FluidTreeItem, options?: FocusOptions): void {
    this.removeAttribute("tabindex");
    this.setTabStop(item);
    item.focus(options);
  }

  private setTabStop(target?: FluidTreeItem): void {
    for (const item of this.getItems()) {
      if (item !== target && target && item.contains(target)) item.removeAttribute("tabindex");
      else item.tabIndex = item === target ? 0 : -1;
    }
  }

  /** Set selection, clearing any prior selection. */
  private selectItem(item: FluidTreeItem): void {
    for (const it of this.getItems()) it.selected = it === item;
  }

  private onItemSelect = (e: CustomEvent<{ item: FluidTreeItem }>) => {
    const item = e.detail?.item;
    if (!item || item.closest("fluid-tree") !== this) return;
    if (item.disabled) {
      e.stopImmediatePropagation();
      return;
    }
    // Let the original item event bubble once. Re-dispatching on this tree
    // would invoke this same listener recursively.
    this.selectItem(item);
    this.focusItem(item);
  };

  override focus(options?: FocusOptions): void {
    // When the tree itself gets focus, hand it to the first item (or selected).
    const items = this.getVisibleItems();
    const target = items.find((item) => item.selected) ?? items[0];
    if (target) this.focusItem(target, options);
    else super.focus(options);
  }

  private onFocus = () => {
    if (this.getVisibleItems().length) this.focus();
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const current = this.focused();
    if (!current || current.disabled || e.defaultPrevented) return;
    const items = this.getVisibleItems();
    const idx = items.indexOf(current);
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.key === "ArrowDown") {
      handled();
      const next = items[Math.min(items.length - 1, idx + 1)];
      if (next) this.focusItem(next);
    } else if (e.key === "ArrowUp") {
      handled();
      const prev = items[Math.max(0, idx - 1)];
      if (prev) this.focusItem(prev);
    } else if (e.key === (this.isRtl ? "ArrowLeft" : "ArrowRight")) {
      handled();
      const hasChildren = current.querySelector(":scope > fluid-tree-item") !== null;
      if (hasChildren && !current.expanded) current.expanded = true;
      else if (hasChildren && current.expanded) {
        const firstChild = items.find((item) => item.parentElement === current);
        if (firstChild) this.focusItem(firstChild);
      }
    } else if (e.key === (this.isRtl ? "ArrowRight" : "ArrowLeft")) {
      handled();
      if (current.expanded) current.expanded = false;
      else {
        const parent = current.parentElement;
        if (parent && parent.tagName === "FLUID-TREE-ITEM") this.focusItem(parent as FluidTreeItem);
      }
    } else if (e.key === "Home") {
      handled();
      const first = items[0];
      if (first) this.focusItem(first);
    } else if (e.key === "End") {
      handled();
      const last = items[items.length - 1];
      if (last) this.focusItem(last);
    } else if (e.key === "Enter" || e.key === " ") {
      handled();
      current.dispatchEvent(
        new CustomEvent("fluid-select", {
          detail: { item: current },
          bubbles: true,
          composed: true
        })
      );
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      this.typeaheadBuffer += e.key.toLocaleLowerCase();
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = setTimeout(() => {
        this.typeaheadBuffer = "";
      }, 500);
      const ordered = [...items.slice(idx + 1), ...items.slice(0, idx + 1)];
      const match = ordered.find((item) =>
        item.label.toLocaleLowerCase().startsWith(this.typeaheadBuffer)
      );
      if (match) {
        handled();
        this.focusItem(match);
      }
    }
  };

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
