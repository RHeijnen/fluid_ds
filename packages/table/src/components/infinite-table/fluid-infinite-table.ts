import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";

export type FluidInfiniteTableRow = Record<string, unknown>;

export interface FluidInfiniteTableCellContext<
  Row extends FluidInfiniteTableRow = FluidInfiniteTableRow
> {
  row: Row;
  rowIndex: number;
  column: FluidInfiniteTableColumn<Row>;
  value: unknown;
}

export interface FluidInfiniteTableColumn<
  Row extends FluidInfiniteTableRow = FluidInfiniteTableRow
> {
  /** Stable identifier used for sorting and persisted layouts. */
  key: string;
  label: string;
  /** Dot-separated row path. Defaults to key. */
  path?: string;
  width?: string;
  visible?: boolean;
  configurable?: boolean;
  sortable?: boolean;
  /**
   * Set false to pin this column's width. Defaults to true when the table is
   * resizable: a column somebody can see is a column somebody can size.
   */
  resizable?: boolean;
  align?: "start" | "center" | "end";
  renderCell?: (context: FluidInfiniteTableCellContext<Row>) => unknown;
  renderHeader?: (column: FluidInfiniteTableColumn<Row>) => unknown;
}

export interface FluidInfiniteTableLayoutItem {
  key: string;
  visible: boolean;
  order: number;
  width?: string;
}

export interface FluidInfiniteTableSort {
  key: string;
  dir: "asc" | "desc";
}

/**
 * A semantic, template-driven table for asynchronously loaded datasets.
 *
 * Unlike `fluid-table`, this component is intended for operational datasets.
 * It supports fixed-height windowing, an infinite-load sentinel, projected
 * filter content, sticky filters and headers, and user-configurable columns.
 * Cell renderers receive the complete row context and may return rich Lit
 * templates, custom elements, links, buttons, badges, or plain values.
 *
 * The table keeps native table semantics. Interactive controls rendered in
 * cells retain their native keyboard behavior. The table itself does not use
 * the ARIA Grid pattern and does not add cell-level arrow-key navigation.
 *
 * Order and width are the same kind of fact as visibility, so all three travel
 * in one `layout` and leave in one `fluid-column-layout-change`. A consumer
 * that already persists a layout persists a resize and a reorder for free.
 *
 * With `reorderable-columns`, a header is dragged by any point of itself, and
 * the columns rearrange live under the pointer as a preview of the drop —
 * releasing keeps what is shown, dropping elsewhere or pressing Escape puts
 * the original order back. Each header also carries a keyboard grab handle:
 * focus it and press Enter or Space to pick the column up, arrow keys to move
 * it, Enter to drop and Escape to put it back. With `resizable-columns`, each
 * header carries a grip on its
 * trailing edge: drag it, double-click (or press Enter) to fit the column to
 * its contents, arrow keys to size it a step at a time (Shift for a bigger
 * step), and Home to restore the declared width.
 *
 * @summary Infinite, windowed and template-driven semantic data table.
 *
 * @fires fluid-load-more - Requests the next result page.
 * @fires fluid-sort - Requests sorting. `detail: { key, dir }`.
 * @fires fluid-column-layout-change - Column visibility, order or width
 *   changed. `detail: { layout }`, complete and ready to persist.
 * @fires fluid-row-click - A non-interactive part of a row was activated.
 *
 * @slot filters - Application-owned filter controls rendered above the header.
 * @slot toolbar-actions - Host controls placed at the end of the toolbar, after
 * the row count and the built-in Columns button. Pair with `configurable=false`
 * and {@link openColumnManager} to replace that button with your own.
 * @slot empty - Empty-result content.
 * @slot error - Error content, shown when `error` is set.
 *
 * @csspart viewport - The scroll container.
 * @csspart toolbar - Sticky filter and table-control region.
 * @csspart progress - Loaded/total result indicator.
 * @csspart base - Native table.
 * @csspart header-row - Table header row.
 * @csspart header-cell - Table header cells.
 * @csspart row - Data rows.
 * @csspart cell - Data cells.
 * @csspart sentinel - Infinite-load sentinel.
 * @csspart column-dialog - Column configuration dialog.
 * @csspart column-grip - Resize handle on a header cell's trailing edge.
 * @csspart column-grab - Reorder handle inside a header cell.
 *
 * @cssproperty --fluid-infinite-table-bg - Table background.
 * @cssproperty --fluid-infinite-table-fg - Table foreground.
 * @cssproperty --fluid-infinite-table-border - Border color.
 * @cssproperty --fluid-infinite-table-header-bg - Sticky header background.
 * @cssproperty --fluid-infinite-table-toolbar-bg - Sticky toolbar background.
 * @cssproperty --fluid-infinite-table-row-hover-bg - Hovered row background.
 * @cssproperty --fluid-infinite-table-radius - Outer radius.
 * @cssproperty --fluid-infinite-table-cell-padding - Cell padding.
 * @cssproperty --fluid-infinite-table-height - Container-scroll height.
 * @cssproperty --fluid-infinite-table-sticky-offset - Offset below app chrome.
 * @cssproperty --fluid-infinite-table-grip-color - Resting colour of a resize
 *   grip and a reorder handle.
 * @cssproperty --fluid-infinite-table-grip-active-color - Colour of a grip
 *   being hovered, focused or dragged.
 *
 * @uses-token --fluid-surface-base
 * @uses-token --fluid-surface-muted
 * @uses-token --fluid-text-primary
 * @uses-token --fluid-text-secondary
 * @uses-token --fluid-border-default
 * @uses-token --fluid-accent-base
 * @uses-token --fluid-radius-md
 * @uses-token --fluid-shadow-lg
 * @uses-token --fluid-focus-ring-width
 * @uses-token --fluid-focus-ring-offset
 * @uses-token --fluid-target-min
 */
export class FluidInfiniteTable extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
      color: var(
        --fluid-infinite-table-fg,
        var(--fluid-text-primary, #18181b)
      );
      font-family: var(--fluid-font-family-sans, system-ui, sans-serif);
    }
    .viewport {
      position: relative;
      border: 1px solid
        var(
          --fluid-infinite-table-border,
          var(--fluid-border-default, #e4e4e7)
        );
      border-radius: var(
        --fluid-infinite-table-radius,
        var(--fluid-radius-md, 0.5rem)
      );
      background: var(
        --fluid-infinite-table-bg,
        var(--fluid-surface-base, #fff)
      );
    }
    :host([scroll-mode="container"]) .viewport {
      max-height: var(--fluid-infinite-table-height, 42rem);
      overflow: auto;
    }
    :host([scroll-mode="document"]) .viewport {
      overflow: visible;
    }
    .toolbar {
      position: sticky;
      top: var(--fluid-infinite-table-sticky-offset, 0px);
      z-index: 4;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.75rem;
      min-height: max(3rem, var(--fluid-target-min, 0px));
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid
        var(
          --fluid-infinite-table-border,
          var(--fluid-border-default, #e4e4e7)
        );
      background: var(
        --fluid-infinite-table-toolbar-bg,
        var(--fluid-surface-base, #fff)
      );
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--fluid-text-secondary, #52525b);
      font-size: 0.75rem;
      white-space: nowrap;
    }
    .progress strong {
      color: var(
        --fluid-infinite-table-fg,
        var(--fluid-text-primary, #18181b)
      );
    }
    button {
      min-width: max(1.75rem, var(--fluid-target-min, 0px));
      min-height: max(1.75rem, var(--fluid-target-min, 0px));
      border: 1px solid
        var(
          --fluid-infinite-table-border,
          var(--fluid-border-default, #e4e4e7)
        );
      border-radius: var(--fluid-radius-sm, 0.25rem);
      background: var(--fluid-surface-base, #fff);
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    button:hover {
      border-color: var(--fluid-accent-base, #4f46e5);
    }
    button:focus-visible,
    input:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-accent-base, #4f46e5);
      outline-offset: var(--fluid-focus-ring-offset, 2px);
    }
    .table-scroll {
      max-width: 100%;
      overflow: visible;
    }
    /*
     * Clip, not scroll. An auto overflow would make this box the scroll
     * container for every sticky descendant, and the header would stick to it
     * instead of to the page. Clip hides the overhang without becoming
     * anything, and the strip below does the actual moving.
     */
    :host([column-scroll]) .table-scroll {
      overflow-x: clip;
    }
    :host([column-scroll]) table {
      transform: translateX(calc(-1 * var(--_fluid-column-scroll, 0px)));
    }
    /*
     * The strip only exists while there is somewhere to go. Hidden rather than
     * unrendered so appearing on a resize is a style change, not a relayout of
     * the header.
     */
    .column-scroll-row {
      display: none;
    }
    :host([column-scroll][data-columns-overflow]) .column-scroll-row {
      display: table-row;
    }
    .column-scroll-cell {
      position: sticky;
      top: calc(
        var(--fluid-infinite-table-sticky-offset, 0px) +
          var(--_fluid-toolbar-height, 0px) +
          var(--_fluid-header-height, 0px)
      );
      z-index: 3;
      padding: 0;
      border-bottom: 1px solid
        var(
          --fluid-infinite-table-border,
          var(--fluid-border-default, #e2e8f0)
        );
      background: var(
        --fluid-infinite-table-header-bg,
        var(--fluid-surface-muted, #f8fafc)
      );
    }
    /*
     * The strip is a child of the transformed table, so it is carried left as
     * the columns go — countered here with the same variable, which pins it to
     * the clip box while everything around it moves. Its width is the clip
     * box's, measured rather than inherited, because inside a table "100%"
     * means the table's own, translated width.
     */
    /*
     * Both parts of the strip undo the cell-content ellipsis rule above: that
     * rule clamps every div in a td to its cell so labels truncate, and the
     * strip is the one div in a td that exists precisely to be wider than its
     * box. Zero-specificity there (:where) means these plain classes win.
     */
    .column-scroll {
      max-width: none;
      width: var(--_fluid-clip-width, 100%);
      height: max(0.85rem, var(--fluid-scrollbar-size, 0.85rem));
      overflow-x: auto;
      overflow-y: hidden;
      transform: translateX(var(--_fluid-column-scroll, 0px));
    }
    .column-scroll-spacer {
      max-width: none;
      width: var(--_fluid-table-width, 0px);
      height: 1px;
    }
    table {
      width: 100%;
      min-width: max-content;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      background: var(
        --fluid-infinite-table-bg,
        var(--fluid-surface-base, #fff)
      );
      font-size: var(--fluid-font-size-sm, 0.875rem);
    }
    caption {
      padding: 0.625rem 0.75rem;
      color: var(--fluid-text-secondary, #52525b);
      font-weight: 600;
      text-align: start;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
    th,
    td {
      box-sizing: border-box;
      height: var(--_fluid-row-height);
      padding: var(
        --fluid-infinite-table-cell-padding,
        0.625rem 0.75rem
      );
      overflow: hidden;
      border-bottom: 1px solid
        var(
          --fluid-infinite-table-border,
          var(--fluid-border-default, #e4e4e7)
        );
      text-align: var(--_cell-align, start);
      text-overflow: ellipsis;
      vertical-align: middle;
      /*
       * A narrowed column truncates with an ellipsis rather than wrapping:
       * wrapped text in a fixed-height row is clipped mid-line, which reads as
       * a rendering fault where "…" reads as a narrow column.
       */
      white-space: nowrap;
    }
    /*
     * The filler is the slack in the table: it has no width while any column
     * is still flexible, and it takes every spare pixel once each column has
     * been given one. Without it the fixed layout hands spare width back to
     * the sized columns, and a column dragged to 100px renders at whatever
     * the redistribution says instead.
     */
    .filler {
      padding: 0;
    }
    /*
     * Sticky already makes a header cell a containing block, so the grip and
     * the drop indicator can be pinned to its edges without a second one.
     */
    thead th,
    thead td {
      position: sticky;
      top: calc(
        var(--fluid-infinite-table-sticky-offset, 0px) +
          var(--_fluid-toolbar-height, 0px)
      );
      z-index: 3;
      height: auto;
      min-height: max(2.5rem, var(--fluid-target-min, 0px));
      background: var(
        --fluid-infinite-table-header-bg,
        var(--fluid-surface-muted, #f4f4f5)
      );
      color: var(
        --fluid-infinite-table-fg,
        var(--fluid-text-primary, #18181b)
      );
      font-weight: 700;
      white-space: nowrap;
    }
    /*
     * Rendered cell content truncates the way plain content does. The cell's
     * own text-overflow only reaches its direct inline content, so each
     * text element a renderer put inside carries the ellipsis itself, and
     * grid-auto-columns clamps the workspace's stacked two-line cells — an
     * implicit grid track otherwise sizes to its longest line and no line
     * ever overflows its own box. :where() keeps every declaration at zero
     * specificity, so a renderer that wants different behaviour just says so.
     */
    td :where(div, span, p, a, strong, em, small, code) {
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      grid-auto-columns: minmax(0, 1fr);
    }
    tbody tr[data-row]:hover td {
      background: var(
        --fluid-infinite-table-row-hover-bg,
        var(--fluid-surface-muted, #f4f4f5)
      );
    }
    :host([clickable]) tbody tr[data-row] {
      cursor: pointer;
    }
    tbody tr[data-row]:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-accent-base, #4f46e5);
      outline-offset: calc(-1 * var(--fluid-focus-ring-offset, 2px));
    }
    .sort {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-width: 0;
      padding: 0;
      border: 0;
      background: transparent;
      font-weight: inherit;
      text-align: inherit;
    }
    /*
     * The label carries its own ellipsis: text-overflow on the cell only
     * reaches the cell's direct inline content, and the label sits a flex
     * container or two deeper than that.
     */
    .header-label {
      display: block;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sort .header-label {
      flex: 1 1 auto;
      text-align: start;
    }
    .sort-mark {
      flex: none;
      margin-inline-start: 0.4rem;
      opacity: 0.55;
    }
    th[aria-sort="ascending"] .sort-mark,
    th[aria-sort="descending"] .sort-mark {
      opacity: 1;
      color: var(--fluid-accent-base, #4f46e5);
    }
    .header-inner {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      min-width: 0;
    }
    .header-inner > :not(.grab) {
      flex: 1 1 auto;
      min-width: 0;
    }
    /*
     * A reorderable header is dragged by any point of itself; the grab button
     * is the keyboard's handle, and it overlays the cell rather than sitting
     * in the flow. In the flow it pushed every header label sideways by its
     * own width, and the labels no longer sat over their cells.
     */
    th[draggable="true"] {
      cursor: grab;
    }
    .grab {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 2px;
      translate: 0 -50%;
      display: inline-grid;
      width: max(1.5rem, var(--fluid-target-min, 0px));
      height: max(1.5rem, var(--fluid-target-min, 0px));
      padding: 0;
      border: 0;
      border-radius: var(--fluid-radius-sm, 0.25rem);
      background: var(
        --fluid-infinite-table-header-bg,
        var(--fluid-surface-muted, #f4f4f5)
      );
      color: var(
        --fluid-infinite-table-grip-color,
        var(--fluid-text-secondary, #52525b)
      );
      opacity: 0;
      pointer-events: none;
      place-items: center;
      transition: opacity 120ms ease;
    }
    .grab:focus-visible,
    .grab[aria-pressed="true"] {
      opacity: 1;
    }
    .grab[aria-pressed="true"] {
      color: var(
        --fluid-infinite-table-grip-active-color,
        var(--fluid-accent-base, #4f46e5)
      );
    }
    .grip {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: 1.25rem;
      cursor: col-resize;
      touch-action: none;
      user-select: none;
      /* Above the draggable header surface, so a resize never starts a drag. */
      z-index: 1;
    }
    .grip::before {
      content: "";
      position: absolute;
      inset-block: 25%;
      inset-inline-end: 0.45rem;
      width: 2px;
      border-radius: var(--fluid-radius-sm, 0.25rem);
      background: var(
        --fluid-infinite-table-grip-color,
        var(--fluid-border-default, #e4e4e7)
      );
      transition: background-color 120ms ease, inset-block 120ms ease;
    }
    th:hover .grip::before {
      background: var(
        --fluid-infinite-table-grip-color,
        var(--fluid-text-secondary, #52525b)
      );
    }
    .grip:hover::before,
    .grip:focus-visible::before,
    .grip[data-dragging]::before {
      inset-block: 8%;
      background: var(
        --fluid-infinite-table-grip-active-color,
        var(--fluid-accent-base, #4f46e5)
      );
    }
    .grip:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-accent-base, #4f46e5);
      /* The header clips its overflow, so the ring is drawn inside it. */
      outline-offset: calc(-1 * var(--fluid-focus-ring-offset, 2px));
    }
    th[data-grabbed] {
      outline: var(--fluid-focus-ring-width, 2px) dashed
        var(--fluid-accent-base, #4f46e5);
      outline-offset: calc(-1 * var(--fluid-focus-ring-offset, 2px));
    }
    /*
     * The dragged column is its own preview: the order rearranges live under
     * the pointer, and the ghosted header marks which column is in hand.
     */
    th[data-dragging] {
      opacity: 0.45;
      outline: var(--fluid-focus-ring-width, 2px) dashed
        var(--fluid-accent-base, #4f46e5);
      outline-offset: calc(-1 * var(--fluid-focus-ring-offset, 2px));
    }
    /*
     * Auto-fit measures a column against its own contents, which only reports
     * the intrinsic width while nothing is allowed to wrap.
     */
    table[data-measuring] th,
    table[data-measuring] td {
      white-space: nowrap;
    }
    .spacer td {
      height: var(--_spacer-height);
      padding: 0;
      border: 0;
    }
    .state,
    .sentinel {
      display: grid;
      min-height: 3.5rem;
      place-items: center;
      color: var(--fluid-text-secondary, #52525b);
      font-size: 0.8125rem;
    }
    dialog {
      width: min(28rem, calc(100vw - 2rem));
      max-height: min(38rem, calc(100vh - 2rem));
      padding: 0;
      overflow: hidden;
      border: 1px solid
        var(
          --fluid-infinite-table-border,
          var(--fluid-border-default, #e4e4e7)
        );
      border-radius: var(
        --fluid-infinite-table-radius,
        var(--fluid-radius-md, 0.5rem)
      );
      background: var(--fluid-surface-base, #fff);
      color: var(--fluid-text-primary, #18181b);
      box-shadow: var(--fluid-shadow-lg, 0 20px 40px rgb(0 0 0 / 0.2));
    }
    dialog::backdrop {
      background: rgb(0 0 0 / 0.45);
    }
    .dialog-head,
    .dialog-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
    }
    .dialog-head {
      border-bottom: 1px solid var(--fluid-border-default, #e4e4e7);
    }
    .dialog-head h2 {
      margin: 0;
      font-size: 1.125rem;
    }
    .dialog-list {
      display: grid;
      gap: 0.25rem;
      max-height: 25rem;
      padding: 0.5rem;
      overflow-y: auto;
    }
    .column-option {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 0.5rem;
      min-height: max(2.75rem, var(--fluid-target-min, 0px));
      padding: 0.25rem 0.5rem;
      border-radius: var(--fluid-radius-sm, 0.25rem);
    }
    .column-option:hover {
      background: var(--fluid-surface-muted, #f4f4f5);
    }
    .column-option input {
      width: max(1rem, var(--fluid-target-min, 0px));
      height: max(1rem, var(--fluid-target-min, 0px));
      accent-color: var(--fluid-accent-base, #4f46e5);
    }
    .column-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }
    .dialog-foot {
      justify-content: flex-end;
      border-top: 1px solid var(--fluid-border-default, #e4e4e7);
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        scroll-behavior: auto !important;
      }
      .grab,
      .grip::before {
        transition: none;
      }
    }
  `;

  @property({ type: Array }) columns: FluidInfiniteTableColumn[] = [];
  @property({ type: Array }) rows: FluidInfiniteTableRow[] = [];
  @property({ type: Array }) layout: FluidInfiniteTableLayoutItem[] = [];
  @property({ type: Number }) total = 0;
  @property({ type: Number, attribute: "available-total" })
  availableTotal = 0;
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean, attribute: "has-more" }) hasMore = false;
  @property({ type: Boolean }) configurable = false;
  @property({ type: Boolean, reflect: true }) clickable = false;
  @property({ type: Boolean }) virtual = true;
  @property({ type: Number, attribute: "row-height" }) rowHeight = 64;
  @property({ type: Number }) overscan = 6;
  @property({ type: String, attribute: "scroll-mode", reflect: true })
  scrollMode: "document" | "container" = "document";
  @property({ type: String }) caption = "";
  @property({ type: Boolean, attribute: "hide-caption" }) hideCaption = false;
  @property({ type: String }) error = "";
  @property({ type: Object }) sort: FluidInfiniteTableSort | null = null;
  @property({ type: String, attribute: "row-key" }) rowKey = "id";
  /** Columns can be dragged, or moved from the keyboard, into another order. */
  @property({ type: Boolean, attribute: "reorderable-columns" })
  reorderableColumns = false;
  /** Column widths can be dragged, auto-fitted, or stepped from the keyboard. */
  @property({ type: Boolean, attribute: "resizable-columns" })
  resizableColumns = false;
  /**
   * Accessible names for the two handles and for the move announcement.
   * `{column}`, `{position}` and `{count}` are substituted. They are properties
   * rather than fixed strings because the application, not the table, knows
   * what language its reader speaks.
   */
  @property({ type: String, attribute: "resize-column-label" })
  resizeColumnLabel = "Resize {column}";
  @property({ type: String, attribute: "reorder-column-label" })
  reorderColumnLabel = "Reorder {column}";
  @property({ type: String, attribute: "column-position-label" })
  columnPositionLabel = "{column}, column {position} of {count}";
  /**
   * Columns wider than the container scroll instead of bursting out of it.
   *
   * Opt-in, because it changes what "too many columns" means: without it the
   * table trusts its container to scroll or grow, with it the table owns the
   * problem and offers a horizontal scrollbar of its own. The scrollbar lives
   * between the header and the rows — a bar at the bottom of a windowed list
   * is wherever the list currently ends, which is nowhere to look for it —
   * and it moves the header and the rows together, because columns that shear
   * against their own headers stop being columns.
   *
   * The mechanics are deliberate: the wrapper *clips* rather than scrolls,
   * and the table is moved with a transform driven by the strip. An
   * `overflow-x: auto` wrapper would become the scroll container for every
   * sticky descendant, and the header would stop following the page.
   */
  @property({ type: Boolean, attribute: "column-scroll", reflect: true })
  columnScroll = false;

  @state() private viewScrollTop = 0;
  @state() private viewportHeight = 800;
  @state() private internalLayout: FluidInfiniteTableLayoutItem[] = [];
  /** The column a keyboard user has picked up, if any. */
  @state() private grabbedKey: string | null = null;
  @state() private draggingKey: string | null = null;
  @state() private announcement = "";
  /**
   * What each column currently measures, for the grip to report.
   *
   * Measured on a layout change and on a resize of the table rather than on
   * every render, because rendering happens on every scroll frame and reading
   * a rectangle there would force a reflow per frame.
   */
  @state() private columnWidths: Record<string, number> = {};

  @query(".viewport") private viewport?: HTMLElement;
  @query(".toolbar") private toolbar?: HTMLElement;
  @query(".sentinel") private sentinel?: HTMLElement;
  @query("dialog") private columnDialog?: HTMLDialogElement;
  @query("table") private table?: HTMLTableElement;
  @query(".column-scroll") private columnScrollStrip?: HTMLElement;
  @query(".table-scroll") private tableScroll?: HTMLElement;

  private intersectionObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private frame = 0;
  private measureFrame = 0;
  private columnOverflowFrame = 0;
  private columnOverflowMeasured = "";
  /** Where a column sat before it was picked up, so Escape can put it back. */
  private grabSnapshot: FluidInfiniteTableLayoutItem[] | null = null;
  /**
   * The order as it stood when a pointer drag began. The drag rearranges the
   * live layout as a preview, so a cancelled drag needs the original to put
   * back and a completed one needs to know whether anything actually moved.
   */
  private dragSnapshot: FluidInfiniteTableLayoutItem[] | null = null;
  private dragMoved = false;
  private resizing: {
    key: string;
    pointerId: number;
    startX: number;
    startWidth: number;
    width: number;
    grip: HTMLElement;
  } | null = null;
  /**
   * A keyboard resize is a burst of keystrokes, and a consumer persists every
   * layout it is handed. One event per burst rather than one per keypress.
   */
  private emitTimer = 0;

  /** No drag or keystroke may leave a column too narrow to read. */
  private static readonly minColumnWidth = 56;
  /** Auto-fit stops here; a single long value should not own the table. */
  private static readonly maxColumnWidth = 640;
  private static readonly resizeStep = 16;
  private static readonly resizeStepLarge = 64;

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("scroll", this.onDocumentScroll, { passive: true });
    window.addEventListener("resize", this.onDocumentScroll, { passive: true });
  }

  override disconnectedCallback(): void {
    window.removeEventListener("scroll", this.onDocumentScroll);
    window.removeEventListener("resize", this.onDocumentScroll);
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.viewport?.removeEventListener("scroll", this.onContainerScroll);
    this.viewport?.removeEventListener("wheel", this.onColumnWheel);
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.measureFrame);
    cancelAnimationFrame(this.columnOverflowFrame);
    clearTimeout(this.emitTimer);
    this.resizing = null;
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this.observeGeometry();
    this.observeSentinel();
    this.onDocumentScroll();
    this.scheduleMeasure();
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("columns") || changed.has("layout")) this.syncLayout();
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (
      changed.has("hasMore") ||
      changed.has("loading") ||
      changed.has("rows") ||
      changed.has("scrollMode")
    ) {
      this.observeSentinel();
    }
    if (changed.has("internalLayout") || changed.has("columns")) {
      this.scheduleMeasure();
    }
  }

  /**
   * Refreshes what the grips report, without churning renders.
   *
   * Off the update cycle, because measuring during it and then writing the
   * result back is the render loop Lit warns about.
   */
  private scheduleMeasure(): void {
    if (!this.resizableColumns) return;
    cancelAnimationFrame(this.measureFrame);
    this.measureFrame = requestAnimationFrame(() => this.measureColumnWidths());
  }

  private measureColumnWidths(): void {
    if (!this.resizableColumns) return;
    const measured: Record<string, number> = {};
    let changed = false;
    for (const cell of this.renderRoot.querySelectorAll<HTMLElement>(
      "th[data-column]"
    )) {
      const key = cell.dataset["column"];
      if (!key) continue;
      const width = Math.round(cell.getBoundingClientRect().width);
      measured[key] = width;
      if (this.columnWidths[key] !== width) changed = true;
    }
    if (
      changed ||
      Object.keys(measured).length !== Object.keys(this.columnWidths).length
    ) {
      this.columnWidths = measured;
    }
  }

  private syncLayout(): void {
    const incoming = new Map(this.layout.map((item) => [item.key, item]));
    this.internalLayout = this.columns
      .map((column, index) => {
        const saved = incoming.get(column.key);
        return {
          key: column.key,
          visible: saved?.visible ?? column.visible !== false,
          order: saved?.order ?? index,
          width: saved?.width ?? column.width
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  private observeGeometry(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      const toolbarHeight = this.toolbar?.getBoundingClientRect().height ?? 0;
      this.style.setProperty("--_fluid-toolbar-height", `${toolbarHeight}px`);
      this.measureScroll();
      this.measureColumnOverflow();
      this.scheduleMeasure();
    });
    if (this.viewport) this.resizeObserver.observe(this.viewport);
    if (this.toolbar) this.resizeObserver.observe(this.toolbar);
    // The table's own width moves when a column is resized, shown or hidden,
    // and each of those can change whether there is any overflow to offer.
    if (this.table) this.resizeObserver.observe(this.table);
    this.viewport?.addEventListener("scroll", this.onContainerScroll, {
      passive: true
    });
    this.viewport?.addEventListener("wheel", this.onColumnWheel, {
      passive: false
    });
  }

  /**
   * Whether the columns outgrow the container, and by how much.
   *
   * Written as host state and custom properties rather than Lit state: this
   * runs from a ResizeObserver, and the strip's geometry is the only thing
   * that depends on it — pushing it through a render would re-draw every row
   * to move a scrollbar.
   */
  private measureColumnOverflow(): void {
    if (!this.columnScroll || !this.table || !this.tableScroll) return;
    const clipWidth = this.tableScroll.clientWidth;
    const tableWidth = Math.ceil(this.table.getBoundingClientRect().width);
    const headerHeight = Math.round(
      this.renderRoot
        .querySelector('[part~="header-row"]')
        ?.getBoundingClientRect().height ?? 0
    );
    /*
     * Writing the strip's geometry resizes the strip, and the strip lives in
     * the observed table — an observer that mutates what it watches in the
     * same frame is a loop the browser reports as an error. Unchanged numbers
     * are therefore not written at all, and changed ones land on the next
     * frame, after this delivery has finished.
     */
    const measured = `${clipWidth}:${tableWidth}:${headerHeight}`;
    if (measured === this.columnOverflowMeasured) return;
    this.columnOverflowMeasured = measured;
    cancelAnimationFrame(this.columnOverflowFrame);
    this.columnOverflowFrame = requestAnimationFrame(() => {
      this.style.setProperty("--_fluid-clip-width", `${clipWidth}px`);
      this.style.setProperty("--_fluid-table-width", `${tableWidth}px`);
      this.style.setProperty("--_fluid-header-height", `${headerHeight}px`);
      const overflowing = tableWidth - clipWidth > 1;
      this.toggleAttribute("data-columns-overflow", overflowing);
      if (!overflowing) {
        // Columns pulled left by a scroll that no longer exists would leave
        // the table cropped on a container that now fits it.
        this.style.setProperty("--_fluid-column-scroll", "0px");
        if (this.columnScrollStrip) this.columnScrollStrip.scrollLeft = 0;
      }
    });
  }

  private readonly onColumnStripScroll = (event: Event): void => {
    const strip = event.currentTarget as HTMLElement;
    this.style.setProperty("--_fluid-column-scroll", `${strip.scrollLeft}px`);
  };

  /**
   * A trackpad swipe over the rows reaches the columns.
   *
   * The clip box is not a scroll container, so the gesture that scrolls every
   * other wide surface would otherwise do nothing here. Forwarded to the strip
   * so the strip stays the one owner of the position; vertical wheel is left
   * alone for the page.
   */
  private readonly onColumnWheel = (event: WheelEvent): void => {
    if (!this.columnScroll || !this.hasAttribute("data-columns-overflow")) return;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    const strip = this.columnScrollStrip;
    if (!strip) return;
    const before = strip.scrollLeft;
    strip.scrollLeft += event.deltaX;
    if (strip.scrollLeft !== before) event.preventDefault();
  };

  private readonly onContainerScroll = (): void => {
    if (this.scrollMode !== "container") return;
    this.measureScroll();
  };

  private readonly onDocumentScroll = (): void => {
    if (this.scrollMode !== "document") return;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.measureScroll());
  };

  private measureScroll(): void {
    if (!this.viewport) return;
    if (this.scrollMode === "container") {
      this.viewScrollTop = this.viewport.scrollTop;
      this.viewportHeight = this.viewport.clientHeight;
      return;
    }
    const rect = this.viewport.getBoundingClientRect();
    this.viewScrollTop = Math.max(0, -rect.top);
    this.viewportHeight = window.innerHeight;
  }

  private observeSentinel(): void {
    this.intersectionObserver?.disconnect();
    if (!this.sentinel || !this.hasMore) return;
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting) &&
          this.hasMore &&
          !this.loading
        ) {
          this.dispatchEvent(
            new CustomEvent("fluid-load-more", {
              detail: { offset: this.rows.length },
              bubbles: true,
              composed: true
            })
          );
        }
      },
      {
        root: this.scrollMode === "container" ? this.viewport : null,
        rootMargin: "400px 0px"
      }
    );
    this.intersectionObserver.observe(this.sentinel);
  }

  private get visibleColumns(): FluidInfiniteTableColumn[] {
    const byKey = new Map(this.columns.map((column) => [column.key, column]));
    return this.internalLayout
      .filter((item) => item.visible)
      .map((item) => {
        const column = byKey.get(item.key)!;
        return { ...column, width: item.width ?? column.width };
      })
      .filter(Boolean);
  }

  private valueAt(row: FluidInfiniteTableRow, column: FluidInfiniteTableColumn): unknown {
    const path = column.path ?? column.key;
    return path.split(".").reduce<unknown>((value, segment) => {
      if (value == null || typeof value !== "object") return undefined;
      return (value as Record<string, unknown>)[segment];
    }, row);
  }

  private rowIdentity(row: FluidInfiniteTableRow, index: number): string {
    const value = this.valueAt(row, { key: this.rowKey, label: this.rowKey });
    return value == null ? String(index) : String(value);
  }

  private get windowedRows(): {
    rows: Array<{ row: FluidInfiniteTableRow; index: number }>;
    top: number;
    bottom: number;
  } {
    if (!this.virtual || !this.rows.length) {
      return {
        rows: this.rows.map((row, index) => ({ row, index })),
        top: 0,
        bottom: 0
      };
    }
    const start = Math.max(
      0,
      Math.floor(this.viewScrollTop / this.rowHeight) - this.overscan
    );
    const amount =
      Math.ceil(this.viewportHeight / this.rowHeight) + this.overscan * 2;
    const end = Math.min(this.rows.length, start + amount);
    return {
      rows: this.rows.slice(start, end).map((row, offset) => ({
        row,
        index: start + offset
      })),
      top: start * this.rowHeight,
      bottom: (this.rows.length - end) * this.rowHeight
    };
  }

  private columnAriaSort(column: FluidInfiniteTableColumn):
    | "ascending"
    | "descending"
    | "none" {
    if (this.sort?.key !== column.key) return "none";
    return this.sort.dir === "asc" ? "ascending" : "descending";
  }

  private requestSort(column: FluidInfiniteTableColumn): void {
    const dir =
      this.sort?.key === column.key && this.sort.dir === "asc" ? "desc" : "asc";
    this.sort = { key: column.key, dir };
    this.dispatchEvent(
      new CustomEvent("fluid-sort", {
        detail: { key: column.key, dir },
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Open the column manager.
   *
   * Public so a host that hides the built-in button (`configurable=false`)
   * can still reach the dialog from its own toolbar control — the dialog is
   * rendered regardless of `configurable`, only the button is gated.
   */
  openColumnManager(): void {
    this.columnDialog?.showModal();
  }

  private openColumns(): void {
    this.openColumnManager();
  }

  private updateColumn(key: string, visible: boolean): void {
    this.internalLayout = this.internalLayout.map((item) =>
      item.key === key ? { ...item, visible } : item
    );
    this.emitLayout();
  }

  private moveColumn(key: string, delta: -1 | 1): void {
    const next = [...this.internalLayout];
    const index = next.findIndex((item) => item.key === key);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    this.internalLayout = next.map((item, order) => ({ ...item, order }));
    this.emitLayout();
  }

  private emitLayout(): void {
    const layout = this.internalLayout.map((item, order) => ({
      ...item,
      order
    }));
    this.dispatchEvent(
      new CustomEvent("fluid-column-layout-change", {
        detail: { layout },
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * One layout event per gesture rather than one per keystroke, because the
   * consumer on the other end of it is usually writing to a server.
   */
  private scheduleLayoutEmit(): void {
    clearTimeout(this.emitTimer);
    this.emitTimer = setTimeout(() => this.emitLayout(), 400) as unknown as number;
  }

  private columnFor(key: string): FluidInfiniteTableColumn | undefined {
    return this.columns.find((column) => column.key === key);
  }

  /** A column that cannot be configured cannot be dragged out of its place. */
  private canReorder(key: string): boolean {
    return (
      this.reorderableColumns && this.columnFor(key)?.configurable !== false
    );
  }

  private canResize(key: string): boolean {
    return this.resizableColumns && this.columnFor(key)?.resizable !== false;
  }

  private label(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (text, [token, value]) => text.split(`{${token}}`).join(String(value)),
      template
    );
  }

  private headerCell(key: string): HTMLElement | undefined {
    return [
      ...this.renderRoot.querySelectorAll<HTMLElement>("th[data-column]")
    ].find((cell) => cell.dataset["column"] === key);
  }

  private columnElement(key: string): HTMLElement | undefined {
    return [
      ...this.renderRoot.querySelectorAll<HTMLElement>("col[data-column]")
    ].find((element) => element.dataset["column"] === key);
  }

  /**
   * Width is stored on the layout item beside visibility and order, so a
   * resize persists through whatever already persists a hidden column.
   * `undefined` puts the column back on the width it was declared with.
   */
  private setColumnWidth(
    key: string,
    width: string | undefined,
    debounce = false
  ): void {
    this.internalLayout = this.internalLayout.map((item) =>
      item.key === key ? { ...item, width } : item
    );
    if (debounce) this.scheduleLayoutEmit();
    else {
      clearTimeout(this.emitTimer);
      this.emitLayout();
    }
  }

  private measuredWidth(key: string): number {
    return (
      this.headerCell(key)?.getBoundingClientRect().width ??
      FluidInfiniteTable.minColumnWidth
    );
  }

  /**
   * Pins every flexible column at the width it happens to be rendered at, so
   * a resize moves one edge and nothing else. Without this the space a drag
   * frees is re-shared among the width-less columns, and the whole table
   * shuffles under the pointer. The resized column is frozen along with the
   * rest — left flexible it would inherit all of their slack the moment they
   * stop being flexible — and the gesture then overwrites its width anyway.
   * Columns that already have a width, declared or previously dragged, are
   * left exactly as written.
   */
  private freezeFlexibleColumns(): void {
    let changed = false;
    const layout = this.internalLayout.map((item) => {
      if (!item.visible || item.width || this.columnFor(item.key)?.width) {
        return item;
      }
      changed = true;
      return { ...item, width: `${Math.round(this.measuredWidth(item.key))}px` };
    });
    if (changed) this.internalLayout = layout;
  }

  /** Which way "wider" points, so a right-to-left reader drags the same way. */
  private get direction(): 1 | -1 {
    return getComputedStyle(this).direction === "rtl" ? -1 : 1;
  }

  private readonly onGripPointerDown = (event: PointerEvent, key: string): void => {
    if (event.button !== 0) return;
    const grip = event.currentTarget as HTMLElement;
    try {
      grip.setPointerCapture(event.pointerId);
    } catch {
      // No live pointer behind this event (a synthesized one, for instance).
      // Capture is an improvement on the drag, not a condition of it.
    }
    grip.setAttribute("data-dragging", "");
    this.freezeFlexibleColumns();
    const startWidth = this.measuredWidth(key);
    this.resizing = {
      key,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth,
      width: startWidth,
      grip
    };
    // Otherwise the drag selects the header text on its way across the table.
    event.preventDefault();
  };

  private readonly onGripPointerMove = (event: PointerEvent): void => {
    const state = this.resizing;
    if (!state || event.pointerId !== state.pointerId) return;
    const moved = (event.clientX - state.startX) * this.direction;
    state.width = Math.max(
      FluidInfiniteTable.minColumnWidth,
      state.startWidth + moved
    );
    // Written straight to the column rather than through a render, so the
    // column follows the pointer instead of the frame after it.
    const column = this.columnElement(state.key);
    if (column) column.style.width = `${Math.round(state.width)}px`;
  };

  private readonly onGripPointerUp = (event: PointerEvent): void => {
    const state = this.resizing;
    if (!state || event.pointerId !== state.pointerId) return;
    this.resizing = null;
    if (state.grip.hasPointerCapture?.(event.pointerId)) {
      state.grip.releasePointerCapture(event.pointerId);
    }
    state.grip.removeAttribute("data-dragging");
    this.setColumnWidth(state.key, `${Math.round(state.width)}px`);
  };

  /**
   * The column's own contents decide its width.
   *
   * Measured with wrapping switched off and the column collapsed, because a
   * cell that has already been given room reports the room rather than the
   * content, and auto-fit would then only ever grow a column.
   */
  private autoFitColumn(key: string): void {
    const index = this.visibleColumns.findIndex((column) => column.key === key);
    const table = this.table;
    const column = this.columnElement(key);
    if (index < 0 || !table || !column) return;
    this.freezeFlexibleColumns();
    const previous = column.style.width;
    table.setAttribute("data-measuring", "");
    column.style.width = "1px";
    let widest = 0;
    for (const row of table.querySelectorAll<HTMLElement>(
      'thead tr[part~="header-row"], tbody tr[data-row]'
    )) {
      const cell = row.children[index] as HTMLElement | undefined;
      if (cell) widest = Math.max(widest, cell.scrollWidth);
    }
    column.style.width = previous;
    table.removeAttribute("data-measuring");
    if (!widest) return;
    this.setColumnWidth(
      key,
      `${Math.min(
        FluidInfiniteTable.maxColumnWidth,
        Math.max(FluidInfiniteTable.minColumnWidth, Math.ceil(widest) + 2)
      )}px`
    );
  }

  private onGripKeydown(event: KeyboardEvent, key: string): void {
    const step = event.shiftKey
      ? FluidInfiniteTable.resizeStepLarge
      : FluidInfiniteTable.resizeStep;
    const wider = this.direction === 1 ? "ArrowRight" : "ArrowLeft";
    const narrower = this.direction === 1 ? "ArrowLeft" : "ArrowRight";
    if (event.key === wider || event.key === narrower) {
      event.preventDefault();
      this.freezeFlexibleColumns();
      const delta = event.key === wider ? step : -step;
      const next = Math.max(
        FluidInfiniteTable.minColumnWidth,
        this.measuredWidth(key) + delta
      );
      this.setColumnWidth(key, `${Math.round(next)}px`, true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.autoFitColumn(key);
    } else if (event.key === "Home") {
      event.preventDefault();
      this.setColumnWidth(key, undefined);
    }
  }

  /**
   * Puts `key` on the near or far side of `targetKey`, silently. Placement
   * and reporting are separate because a pointer drag places on every
   * `dragover` as a live preview, and a consumer persists every layout it is
   * handed — the report belongs to the drop, not to the preview.
   */
  private placeColumn(
    key: string,
    targetKey: string,
    edge: "start" | "end"
  ): boolean {
    if (key === targetKey || !this.canReorder(key) || !this.canReorder(targetKey)) {
      return false;
    }
    const moved = this.internalLayout.find((item) => item.key === key);
    if (!moved) return false;
    const next = this.internalLayout.filter((item) => item.key !== key);
    const at = next.findIndex((item) => item.key === targetKey);
    if (at < 0) return false;
    next.splice(edge === "end" ? at + 1 : at, 0, moved);
    if (
      next.map((item) => item.key).join(" ") ===
      this.internalLayout.map((item) => item.key).join(" ")
    ) {
      return false;
    }
    this.internalLayout = next.map((item, order) => ({ ...item, order }));
    return true;
  }

  /** Places `key` beside `targetKey`, and reports it. */
  private reorderColumn(
    key: string,
    targetKey: string,
    edge: "start" | "end"
  ): void {
    if (!this.placeColumn(key, targetKey, edge)) return;
    clearTimeout(this.emitTimer);
    this.emitLayout();
    this.announceColumn(key);
  }

  /** One place along the row of visible columns, for the keyboard path. */
  private moveColumnStep(key: string, delta: -1 | 1): void {
    const visible = this.visibleColumns.map((column) => column.key);
    const index = visible.indexOf(key);
    const neighbour = visible[index + delta];
    // A fixed column is a wall rather than something to jump over: a selection
    // box that has wandered into the middle of a table is a broken table.
    if (index < 0 || neighbour === undefined || !this.canReorder(neighbour)) {
      return;
    }
    this.reorderColumn(key, neighbour, delta === 1 ? "end" : "start");
  }

  private announceColumn(key: string): void {
    const visible = this.visibleColumns;
    const index = visible.findIndex((column) => column.key === key);
    if (index < 0) return;
    this.announcement = this.label(this.columnPositionLabel, {
      column: visible[index]!.label,
      position: index + 1,
      count: visible.length
    });
  }

  private onGrabKeydown(event: KeyboardEvent, key: string): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (this.grabbedKey === key) {
        this.grabbedKey = null;
        this.grabSnapshot = null;
      } else {
        this.grabbedKey = key;
        this.grabSnapshot = this.internalLayout.map((item) => ({ ...item }));
        this.announceColumn(key);
      }
      return;
    }
    if (this.grabbedKey !== key) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (this.grabSnapshot) {
        this.internalLayout = this.grabSnapshot;
        clearTimeout(this.emitTimer);
        this.emitLayout();
      }
      this.grabbedKey = null;
      this.grabSnapshot = null;
      this.announceColumn(key);
      return;
    }
    const forward = this.direction === 1 ? "ArrowRight" : "ArrowLeft";
    const backward = this.direction === 1 ? "ArrowLeft" : "ArrowRight";
    if (event.key === forward || event.key === backward) {
      event.preventDefault();
      this.moveColumnStep(key, event.key === forward ? 1 : -1);
    }
  }

  private onGrabDragStart(event: DragEvent, key: string): void {
    this.draggingKey = key;
    this.dragSnapshot = this.internalLayout.map((item) => ({ ...item }));
    this.dragMoved = false;
    event.dataTransfer?.setData("text/plain", key);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  }

  /**
   * The whole header is the drag surface — a hover-revealed handle the size
   * of a coin is a target nobody was hitting. A drag that begins on the
   * resize grip is a resize, and is refused here rather than raced.
   */
  private onHeaderDragStart(event: DragEvent, key: string): void {
    if (
      event
        .composedPath()
        .some(
          (target) =>
            target instanceof HTMLElement && target.classList.contains("grip")
        )
    ) {
      event.preventDefault();
      return;
    }
    this.onGrabDragStart(event, key);
  }

  /** Which side of `key` the pointer is asking for. */
  private dropEdge(event: DragEvent): "start" | "end" {
    const cell = event.currentTarget as HTMLElement;
    const rect = cell.getBoundingClientRect();
    const past = (event.clientX - rect.left) / (rect.width || 1) > 0.5;
    return (this.direction === 1 ? past : !past) ? "end" : "start";
  }

  /**
   * The preview: crossing a header moves the dragged column there, whole and
   * live, so what is on screen during the drag is the table the drop would
   * produce. After a move the slot under the pointer holds the dragged column
   * itself, which the `dragged === key` guard turns into a resting state
   * rather than a flicker.
   */
  private onHeaderDragOver(event: DragEvent, key: string): void {
    const dragged = this.draggingKey;
    if (!dragged || !this.canReorder(key)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    if (dragged === key) return;
    if (this.placeColumn(dragged, key, this.dropEdge(event))) {
      this.dragMoved = true;
    }
  }

  private onHeaderDrop(event: DragEvent, key: string): void {
    const dragged = this.draggingKey ?? event.dataTransfer?.getData("text/plain");
    if (!dragged) return;
    event.preventDefault();
    // A drop that never previewed — a drop dispatched without dragover —
    // still places once, on whichever side of the target it landed.
    if (!this.dragMoved && dragged !== key) {
      this.dragMoved = this.placeColumn(dragged, key, this.dropEdge(event));
    }
    const moved = this.dragMoved;
    this.draggingKey = null;
    this.dragSnapshot = null;
    this.dragMoved = false;
    if (moved) {
      clearTimeout(this.emitTimer);
      this.emitLayout();
      this.announceColumn(dragged);
    }
  }

  /**
   * After a drop this is bookkeeping; without one it is a cancel, and the
   * order the drag started from comes back.
   */
  private readonly onDragEnd = (): void => {
    if (this.draggingKey && this.dragSnapshot && this.dragMoved) {
      this.internalLayout = this.dragSnapshot;
    }
    this.draggingKey = null;
    this.dragSnapshot = null;
    this.dragMoved = false;
  };

  private handleRowClick(event: MouseEvent, row: FluidInfiniteTableRow, index: number): void {
    if (!this.clickable) return;
    const target = event.composedPath()[0];
    if (
      target instanceof Element &&
      target.closest("a,button,input,select,textarea,[role='button']")
    ) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("fluid-row-click", {
        detail: { row, rowIndex: index, originalEvent: event },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleRowKeydown(
    event: KeyboardEvent,
    row: FluidInfiniteTableRow,
    index: number
  ): void {
    if (!this.clickable || (event.key !== "Enter" && event.key !== " ")) return;
    if (event.composedPath().some((target) =>
      target instanceof Element &&
      target.matches("a,button,input,select,textarea,[role='button']")
    )) {
      return;
    }
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent("fluid-row-click", {
        detail: { row, rowIndex: index, originalEvent: event },
        bubbles: true,
        composed: true
      })
    );
  }

  private renderHeader(column: FluidInfiniteTableColumn): unknown {
    const content = column.renderHeader?.(column) ?? column.label;
    return column.sortable
      ? html`<button
          class="sort"
          type="button"
          @click=${() => this.requestSort(column)}
        >
          <span class="header-label">${content}</span>
          <span class="sort-mark" aria-hidden="true">
            ${this.sort?.key === column.key
              ? this.sort.dir === "asc"
                ? "↑"
                : "↓"
              : "↕"}
          </span>
        </button>`
      : html`<span class="header-label">${content}</span>`;
  }

  /**
   * The header content, with whichever handles this column has earned.
   *
   * The handles sit beside the sort control rather than inside it: a grip
   * nested in a button is a button that cannot be pressed and a grip that
   * cannot be dragged. The pointer drags the header cell itself; the grab
   * button is the keyboard's way in, overlaid so it costs the label nothing.
   */
  private renderHeaderContent(column: FluidInfiniteTableColumn): unknown {
    const reorderable = this.canReorder(column.key);
    const resizable = this.canResize(column.key);
    if (!reorderable && !resizable) return this.renderHeader(column);
    return html`
      <div class="header-inner">
        ${reorderable
          ? html`<button
              part="column-grab"
              class="grab"
              type="button"
              aria-pressed=${this.grabbedKey === column.key}
              aria-label=${this.label(this.reorderColumnLabel, {
                column: column.label
              })}
              @keydown=${(event: KeyboardEvent) =>
                this.onGrabKeydown(event, column.key)}
            >
              <span aria-hidden="true">⠿</span>
            </button>`
          : nothing}
        ${this.renderHeader(column)}
      </div>
      ${resizable
        ? html`<span
            part="column-grip"
            class="grip"
            role="separator"
            tabindex="0"
            aria-orientation="vertical"
            aria-label=${this.label(this.resizeColumnLabel, {
              column: column.label
            })}
            aria-valuemin=${FluidInfiniteTable.minColumnWidth}
            aria-valuenow=${this.columnWidths[column.key] ??
            FluidInfiniteTable.minColumnWidth}
            @pointerdown=${(event: PointerEvent) =>
              this.onGripPointerDown(event, column.key)}
            @pointermove=${this.onGripPointerMove}
            @pointerup=${this.onGripPointerUp}
            @pointercancel=${this.onGripPointerUp}
            @dblclick=${() => this.autoFitColumn(column.key)}
            @keydown=${(event: KeyboardEvent) =>
              this.onGripKeydown(event, column.key)}
          ></span>`
        : nothing}
    `;
  }

  private renderColumnsDialog(): TemplateResult {
    return html`
      <dialog part="column-dialog" aria-labelledby="column-dialog-title">
        <div class="dialog-head">
          <h2 id="column-dialog-title">Table columns</h2>
          <button
            type="button"
            aria-label="Close column settings"
            @click=${() => this.columnDialog?.close()}
          >
            ×
          </button>
        </div>
        <div class="dialog-list">
          ${this.internalLayout.map((item, index) => {
            const column = this.columns.find((candidate) => candidate.key === item.key);
            if (!column || column.configurable === false) return nothing;
            return html`
              <div class="column-option">
                <label class="column-toggle">
                  <input
                    type="checkbox"
                    .checked=${item.visible}
                    @change=${(event: Event) =>
                      this.updateColumn(
                        item.key,
                        (event.target as HTMLInputElement).checked
                      )}
                  />
                  <span>${column.label}</span>
                </label>
                <button
                  type="button"
                  aria-label=${`Move ${column.label} earlier`}
                  ?disabled=${index === 0}
                  @click=${() => this.moveColumn(item.key, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label=${`Move ${column.label} later`}
                  ?disabled=${index === this.internalLayout.length - 1}
                  @click=${() => this.moveColumn(item.key, 1)}
                >
                  ↓
                </button>
              </div>
            `;
          })}
        </div>
        <div class="dialog-foot">
          <button type="button" @click=${() => this.columnDialog?.close()}>
            Done
          </button>
        </div>
      </dialog>
    `;
  }

  override render(): TemplateResult {
    const columns = this.visibleColumns;
    const window = this.windowedRows;
    const hasFilters = true;
    return html`
      <div
        part="viewport"
        class="viewport"
        style=${`--_fluid-row-height:${this.rowHeight}px;`}
      >
        <div part="toolbar" class="toolbar">
          <div>${hasFilters ? html`<slot name="filters"></slot>` : nothing}</div>
          <div class="toolbar-actions">
            <span part="progress" class="progress" role="status">
              <strong>${this.rows.length.toLocaleString()}</strong> loaded
              ${this.total
                ? html`of <strong>${this.total.toLocaleString()}</strong>`
                : nothing}
              ${this.availableTotal && this.availableTotal !== this.total
                ? html`matching ·
                    <strong>${this.availableTotal.toLocaleString()}</strong>
                    total`
                : nothing}
            </span>
            ${this.configurable
              ? html`<button type="button" @click=${this.openColumns}>
                  Columns
                </button>`
              : nothing}
            <slot name="toolbar-actions"></slot>
          </div>
        </div>

        <div class="table-scroll">
          <table
            part="base"
            aria-rowcount=${this.total || this.rows.length}
            aria-colcount=${columns.length}
          >
            ${this.caption
              ? html`<caption class=${this.hideCaption ? "sr-only" : ""}>
                  ${this.caption}
                </caption>`
              : nothing}
            <colgroup>
              ${columns.map((column) => {
                // A render that lands mid-drag must not put the column back
                // on its pointer-down width; the pointer knows better.
                const width =
                  this.resizing?.key === column.key
                    ? `${Math.round(this.resizing.width)}px`
                    : column.width;
                return html`<col
                  data-column=${column.key}
                  style=${width ? `width:${width}` : ""}
                />`;
              })}
              <col
                class="filler"
                style=${columns.every((column) => column.width)
                  ? nothing
                  : "width:0"}
              />
            </colgroup>
            <thead>
              <tr part="header-row">
                ${columns.map(
                  (column) => html`
                    <th
                      part="header-cell"
                      scope="col"
                      data-column=${column.key}
                      data-grabbed=${this.grabbedKey === column.key
                        ? ""
                        : nothing}
                      data-dragging=${this.draggingKey === column.key
                        ? ""
                        : nothing}
                      aria-sort=${column.sortable
                        ? this.columnAriaSort(column)
                        : nothing}
                      style=${`--_cell-align:${column.align ?? "start"};`}
                      draggable=${this.canReorder(column.key)
                        ? "true"
                        : nothing}
                      @dragstart=${(event: DragEvent) =>
                        this.onHeaderDragStart(event, column.key)}
                      @dragend=${this.onDragEnd}
                      @dragover=${(event: DragEvent) =>
                        this.onHeaderDragOver(event, column.key)}
                      @drop=${(event: DragEvent) =>
                        this.onHeaderDrop(event, column.key)}
                    >
                      ${this.renderHeaderContent(column)}
                    </th>
                  `
                )}
                <td class="filler" aria-hidden="true"></td>
              </tr>
              ${this.columnScroll
                ? html`<tr class="column-scroll-row" aria-hidden="true">
                    <td class="column-scroll-cell" colspan=${columns.length + 1}>
                      <div
                        part="column-scroll"
                        class="column-scroll"
                        @scroll=${this.onColumnStripScroll}
                      >
                        <div class="column-scroll-spacer"></div>
                      </div>
                    </td>
                  </tr>`
                : nothing}
            </thead>
            <tbody>
              ${window.top
                ? html`<tr class="spacer" aria-hidden="true">
                    <td
                      colspan=${columns.length + 1}
                      style=${`--_spacer-height:${window.top}px`}
                    ></td>
                  </tr>`
                : nothing}
              ${window.rows.map(
                ({ row, index }) => html`
                  <tr
                    part="row"
                    data-row
                    data-row-key=${this.rowIdentity(row, index)}
                    tabindex=${this.clickable ? "0" : nothing}
                    @click=${(event: MouseEvent) =>
                      this.handleRowClick(event, row, index)}
                    @keydown=${(event: KeyboardEvent) =>
                      this.handleRowKeydown(event, row, index)}
                  >
                    ${columns.map((column) => {
                      const value = this.valueAt(row, column);
                      const rendered = column.renderCell
                        ? column.renderCell({
                            row,
                            rowIndex: index,
                            column,
                            value
                          })
                        : value;
                      return html`
                        <td
                          part="cell"
                          style=${`--_cell-align:${column.align ?? "start"};`}
                        >
                          ${rendered ?? ""}
                        </td>
                      `;
                    })}
                    <td class="filler" aria-hidden="true"></td>
                  </tr>
                `
              )}
              ${window.bottom
                ? html`<tr class="spacer" aria-hidden="true">
                    <td
                      colspan=${columns.length + 1}
                      style=${`--_spacer-height:${window.bottom}px`}
                    ></td>
                  </tr>`
                : nothing}
            </tbody>
          </table>
        </div>

        ${this.error
          ? html`<div class="state" role="alert"><slot name="error">${this.error}</slot></div>`
          : !this.loading && !this.rows.length
            ? html`<div class="state"><slot name="empty">No results</slot></div>`
            : nothing}
        <!--
          Where a moved column landed. A drag is self-evident on screen and
          silent to a screen reader, so the keyboard path says it out loud.
        -->
        <div class="sr-only" role="status" aria-live="polite">
          ${this.announcement}
        </div>
        <div part="sentinel" class="sentinel" role="status">
          ${this.loading
            ? "Loading more results"
            : this.hasMore
              ? "Scroll to load more"
              : this.rows.length
                ? "All results loaded"
                : ""}
        </div>
      </div>
      ${this.renderColumnsDialog()}
    `;
  }
}
