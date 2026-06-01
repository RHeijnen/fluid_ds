import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";
import type { FluidDescriptionItem } from "./fluid-description-item.js";

/**
 * A list of key/value pairs: think profile fields, order summaries, metadata
 * panels, or specification sheets. Renders a set of `<fluid-description-item>`
 * children, each pairing a term (the key) with its detail (the value).
 *
 * This is a presentational, semantic container. A native `<dl>` would be the
 * ideal element, but a shadow-DOM `<dl>` may not legally contain a `<slot>` as
 * a direct child (only `<dt>` / `<dd>` / `<div>` groupings are valid children),
 * so projecting authored items through a slot inside a real `<dl>` is a markup
 * violation. Following the precedent set by `<fluid-steps>` and
 * `<fluid-timeline>`, the container therefore uses `role="list"` with each item
 * as `role="listitem"`. This yields an equivalent accessibility tree: screen
 * readers announce the item count and iterate the pairs in reading order, and
 * each item names itself by reading its term then its detail.
 *
 * It is not interactive and does not own a value.
 *
 * @summary Container for a set of `<fluid-description-item>` key/value pairs.
 *
 * @slot - One or more `<fluid-description-item>` elements.
 *
 * @csspart base - The list wrapper (role="list").
 *
 * @cssproperty --fluid-description-list-gap - Vertical gap between rows. Falls back to --fluid-space-3.
 * @cssproperty --fluid-description-list-column-gap - Horizontal gap between grid columns. Falls back to --fluid-space-6.
 * @cssproperty --fluid-description-list-min-column - Minimum width of a column before wrapping. Falls back to 16rem.
 * @cssproperty --fluid-description-list-divider-color - Color of the rule drawn between rows when `divider` is set. Falls back to --fluid-border-default.
 *
 * @uses-token --fluid-space-3 - Default gap between rows.
 * @uses-token --fluid-space-6 - Default horizontal gap between grid columns.
 * @uses-token --fluid-border-default - Default divider rule color.
 * @uses-token --fluid-font-family-sans - Inherited typography for slotted content.
 */
export class FluidDescriptionList extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans);
      line-height: var(--fluid-line-height-normal, 1.5);
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-description-list-gap, var(--fluid-space-3));
    }

    /*
     * columns greater than 1 lays the pairs out as a responsive grid. We place
     * the requested number of equal tracks (--_dl-columns), but each track is
     * allowed to shrink to a minimum width via min(); once a track would dip
     * below that floor the tracks reflow, so on narrow viewports the grid stays
     * within its container instead of overflowing. min(100%, floor) guards the
     * single-column case where the floor exceeds the available width.
     */
    :host([columns]) .base {
      display: grid;
      grid-template-columns: repeat(
        var(--_dl-columns, 2),
        minmax(
          min(100%, var(--fluid-description-list-min-column, 16rem)),
          1fr
        )
      );
      column-gap: var(--fluid-description-list-column-gap, var(--fluid-space-6));
      row-gap: var(--fluid-description-list-gap, var(--fluid-space-3));
    }

    /*
     * The divider is drawn as a top rule on every row after the first, so the
     * rule sits between rows and never above the first or below the last. In a
     * single-column layout each item is a row. In a grid we keep the same per
     * row rule.
     */
    :host([divider]) ::slotted(fluid-description-item:not(:first-child)) {
      border-top: 1px solid
        var(--fluid-description-list-divider-color, var(--fluid-border-default));
      padding-top: var(--fluid-description-list-gap, var(--fluid-space-3));
    }
  `;

  /**
   * Number of columns to lay the pairs out across. The default of 1 stacks the
   * pairs vertically. A value greater than 1 switches to a responsive grid that
   * fits as many columns as the width allows, up to this number, then collapses
   * gracefully on narrow viewports.
   *
   * Reflection is handled manually (not `reflect: true`): the grid styles key off
   * the presence of the `columns` attribute, but a single column must strip the
   * attribute entirely. Letting Lit reflect would write `columns="1"` and then a
   * manual `removeAttribute` would feed `null` back into this property, so we
   * mirror the attribute ourselves in `syncColumnsAttribute`.
   */
  @property({ type: Number, reflect: false }) columns = 1;

  /** True while we are writing the `columns` attribute ourselves, so the
   * resulting attribute change is not parsed back into the property. */
  private syncingColumnsAttr = false;

  /** Draw a horizontal rule between each pair. */
  @property({ type: Boolean, reflect: true }) divider = false;

  /** Accessible name for the list. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncItems();
  }

  protected override firstUpdated(): void {
    this.syncItems();
  }

  override attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void {
    // Ignore the attribute change we trigger ourselves when mirroring `columns`,
    // so writing the attribute never parses back into (and clobbers) the property.
    if (name === "columns" && this.syncingColumnsAttr) return;
    super.attributeChangedCallback(name, old, value);
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("columns")) {
      this.syncColumnsAttribute();
    }
    this.syncItems();
  }

  /**
   * Mirror `columns` onto the attribute the grid styles key off: a single column
   * strips the attribute (flex stack), more than one writes the count. We guard
   * the write so the induced attribute change is not parsed back into the
   * property.
   */
  private syncColumnsAttribute(): void {
    const cap = Math.max(1, Math.floor(this.columns));
    this.syncingColumnsAttr = true;
    if (cap > 1) {
      this.setAttribute("columns", String(cap));
    } else {
      this.removeAttribute("columns");
    }
    this.syncingColumnsAttr = false;
  }

  private getItems(): FluidDescriptionItem[] {
    return Array.from(
      this.querySelectorAll("fluid-description-item")
    ) as FluidDescriptionItem[];
  }

  /**
   * Feed the requested column count to the grid template. The grid lays out
   * exactly this many equal tracks; each track may shrink to a minimum width
   * and reflow on narrow viewports (see the grid styles). A count of 1 leaves
   * the property unset so the flex column layout applies instead.
   */
  private syncItems(): void {
    const cap = Math.max(1, Math.floor(this.columns));
    if (cap > 1) {
      this.style.setProperty("--_dl-columns", String(cap));
    } else {
      this.style.removeProperty("--_dl-columns");
    }
  }

  private handleSlotChange = () => this.syncItems();

  override render(): TemplateResult {
    return html`
      <div
        part="base"
        class="base"
        role="list"
        aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}
