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

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "tree");
    this.tabIndex = 0;
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("fluid-select", this.onItemSelect as EventListener);
    this.addEventListener("focus", this.onFocus);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("fluid-select", this.onItemSelect as EventListener);
    this.removeEventListener("focus", this.onFocus);
  }

  protected override firstUpdated(): void {
    // Set levels for direct children (they'll cascade).
    for (const child of Array.from(this.children)) {
      if (child.tagName === "FLUID-TREE-ITEM") {
        (child as FluidTreeItem).level = 0;
      }
    }
    if (this.initialSelected) {
      const target = this.querySelector<FluidTreeItem>(
        `fluid-tree-item[id="${this.initialSelected}"]`
      );
      if (target) this.selectItem(target);
    }
  }

  /** All visible tree items in document order (collapsed branches excluded). */
  private getVisibleItems(): FluidTreeItem[] {
    const items: FluidTreeItem[] = [];
    const walk = (el: Element) => {
      for (const child of Array.from(el.children)) {
        if (child.tagName === "FLUID-TREE-ITEM") {
          const item = child as FluidTreeItem;
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
    return (this.querySelector("fluid-tree-item:focus") as FluidTreeItem) ?? null;
  }

  /** Move focus to a specific item, scrolling as needed. */
  private focusItem(item: FluidTreeItem): void {
    for (const it of this.querySelectorAll<FluidTreeItem>("fluid-tree-item")) {
      it.tabIndex = -1;
    }
    item.tabIndex = 0;
    item.focus();
  }

  /** Set selection, clearing any prior selection. */
  private selectItem(item: FluidTreeItem): void {
    for (const it of this.querySelectorAll<FluidTreeItem>("fluid-tree-item[selected]")) {
      it.selected = false;
    }
    item.selected = true;
  }

  private onItemSelect = (e: CustomEvent<{ item: FluidTreeItem }>) => {
    // Don't re-emit a synthetic fluid-select; just adjust state.
    e.stopPropagation();
    this.selectItem(e.detail.item);
    this.focusItem(e.detail.item);
    this.dispatchEvent(
      new CustomEvent("fluid-select", {
        detail: { item: e.detail.item },
        bubbles: true,
        composed: true
      })
    );
  };

  private onFocus = () => {
    // When the tree itself gets focus, hand it to the first item (or selected).
    const selected = this.querySelector<FluidTreeItem>("fluid-tree-item[selected]");
    const first = this.querySelector<FluidTreeItem>("fluid-tree-item");
    const target = selected ?? first;
    if (target) this.focusItem(target);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const current = this.focused();
    if (!current) return;
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
    } else if (e.key === "ArrowRight") {
      handled();
      const hasChildren = current.querySelector(":scope > fluid-tree-item") !== null;
      if (hasChildren && !current.expanded) current.expanded = true;
      else if (hasChildren && current.expanded) {
        const firstChild = current.querySelector<FluidTreeItem>(":scope > fluid-tree-item");
        if (firstChild) this.focusItem(firstChild);
      }
    } else if (e.key === "ArrowLeft") {
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
      this.selectItem(current);
      this.dispatchEvent(
        new CustomEvent("fluid-select", {
          detail: { item: current },
          bubbles: true,
          composed: true
        })
      );
    }
  };

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
