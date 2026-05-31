import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";

registerIcon(
  "chevron-down",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>`
);

/**
 * A node in a `<fluid-tree>`. Place child `<fluid-tree-item>` elements
 * inside (they're auto-routed to the `children` slot) and any other content
 * becomes the label.
 *
 * Don't drive selection state directly, let the parent `<fluid-tree>`
 * coordinate so only one item can be selected at a time.
 *
 * @summary Tree node.
 *
 * @slot - Label content (text + optional icon).
 * @slot children - Reserved for nested `<fluid-tree-item>` (assigned automatically).
 *
 * @csspart base - The row containing chevron + label.
 * @csspart label - The label content.
 * @csspart children - The wrapper around child items.
 *
 * Every styled property reads a component-scoped `--fluid-tree-item-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-tree-indent - Indent per level. Falls back to 1.25rem.
 * @cssproperty --fluid-tree-item-fg - Default text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-tree-item-hover-bg - Row hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-tree-item-selected-accent - Accent color for the selected row. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-tree-item-chevron-fg - Chevron color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-tree-item-radius - Row corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-tree-item-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-tree-item-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-tree-item-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-accent-base - Selection background tint + text.
 * @uses-token --fluid-surface-muted - Row hover background.
 * @uses-token --fluid-text-primary - Default text color.
 * @uses-token --fluid-text-secondary - Chevron color.
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum row hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-radius-sm - Row corner radius.
 * @uses-token --fluid-font-family-sans - Font family.
 *
 * @fires fluid-toggle - Fired when expanded changes; detail = { expanded }.
 */
export class FluidTreeItem extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--fluid-tree-item-fg, var(--fluid-text-primary));
      font-family: var(--fluid-tree-item-font-family, var(--fluid-font-family-sans));
      --_indent: var(--fluid-tree-indent, 1.25rem);
    }

    /* SC 2.5.8 Target Size, the row floors its height to --fluid-target-min. */
    .row {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
      min-height: var(--fluid-target-min, 0px);
      padding: 0.25rem 0.5rem;
      border-radius: var(--fluid-tree-item-radius, var(--fluid-radius-sm));
      cursor: pointer;
      user-select: none;
      padding-left: calc(var(--_level, 0) * var(--_indent) + var(--fluid-space-2));
    }
    .row:hover {
      background: var(--fluid-tree-item-hover-bg, var(--fluid-surface-muted));
    }

    :host([selected]) > .row {
      background: color-mix(
        in srgb,
        var(--fluid-tree-item-selected-accent, var(--fluid-accent-base)) 15%,
        transparent
      );
      color: var(--fluid-tree-item-selected-accent, var(--fluid-accent-base));
      font-weight: var(--fluid-font-weight-medium);
    }

    :host(:focus) {
      outline: none;
    }
    :host(:focus) > .row {
      outline: var(--fluid-tree-item-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-tree-item-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: -2px;
    }

    .chevron {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      transition: transform 120ms ease;
      flex-shrink: 0;
      color: var(--fluid-tree-item-chevron-fg, var(--fluid-text-secondary));
    }
    .chevron[data-leaf] {
      visibility: hidden;
    }
    :host([expanded]) .chevron {
      transform: rotate(0deg);
    }
    :host(:not([expanded])) .chevron {
      transform: rotate(-90deg);
    }

    .children {
      display: none;
    }
    :host([expanded]) .children {
      display: block;
    }

    :host([disabled]) > .row {
      opacity: 0.5;
      pointer-events: none;
    }
  `;

  /** Expanded state. */
  @property({ type: Boolean, reflect: true }) expanded = false;

  /** Selected state. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Treat this node as a leaf (no chevron). Auto-detected if not set. */
  @property({ type: Boolean, reflect: true }) leaf = false;

  /** @internal Depth in the tree, set by the parent. */
  @state() level = 0;

  /** @internal Whether any direct-child tree items exist. */
  @state() private hasChildren = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "treeitem");
    this.tabIndex = -1;
  }

  protected override firstUpdated(): void {
    this.routeChildren();
    const mo = new MutationObserver(() => this.routeChildren());
    mo.observe(this, { childList: true });
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("expanded")) {
      this.setAttribute("aria-expanded", String(this.expanded));
      this.dispatchEvent(
        new CustomEvent("fluid-toggle", {
          detail: { expanded: this.expanded },
          bubbles: true,
          composed: true
        })
      );
    }
    if (changed.has("selected")) {
      this.setAttribute("aria-selected", String(this.selected));
    }
    if (changed.has("level")) {
      this.style.setProperty("--_level", String(this.level));
    }
  }

  /** Move child tree-items into the dedicated `children` slot for layout. */
  private routeChildren(): void {
    let hasChildren = false;
    for (const child of Array.from(this.children)) {
      if (child.tagName === "FLUID-TREE-ITEM") {
        if (child.getAttribute("slot") !== "children") child.setAttribute("slot", "children");
        (child as FluidTreeItem).level = this.level + 1;
        hasChildren = true;
      }
    }
    this.hasChildren = hasChildren;
  }

  private onRowClick = (e: MouseEvent) => {
    if (this.disabled) return;
    const target = e.target as HTMLElement;
    if (target.closest(".chevron") && this.hasChildren) {
      this.expanded = !this.expanded;
      return;
    }
    this.dispatchEvent(
      new CustomEvent("fluid-select", { detail: { item: this }, bubbles: true, composed: true })
    );
  };

  override render(): TemplateResult {
    const leaf = this.leaf || !this.hasChildren;
    return html`
      <div part="base" class="row" @click=${this.onRowClick}>
        <span class="chevron" ?data-leaf=${leaf}>
          <fluid-icon name="chevron-down"></fluid-icon>
        </span>
        <span part="label" class="label"><slot></slot></span>
      </div>
      <div part="children" class="children" role="group">
        <slot name="children"></slot>
      </div>
    `;
  }
}
