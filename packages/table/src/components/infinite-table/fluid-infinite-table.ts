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
 * With `reorderable-columns`, each header carries a grab handle: drag it, or
 * focus it and press Enter or Space to pick the column up, arrow keys to move
 * it, Enter to drop and Escape to put it back. With `resizable-columns`, each
 * header carries a grip on its trailing edge: drag it, double-click (or press
 * Enter) to fit the column to its contents, arrow keys to size it a step at a
 * time (Shift for a bigger step), and Home to restore the declared width.
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
 *   being hovered, focused or dragged, and of the drop indicator.
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
    }
    /*
     * Sticky already makes a header cell a containing block, so the grip and
     * the drop indicator can be pinned to its edges without a second one.
     */
    thead th {
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
      padding: 0;
      border: 0;
      background: transparent;
      font-weight: inherit;
      text-align: inherit;
    }
    .sort-mark {
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
     * Both handles are quiet until the header is pointed at or something in it
     * is focused. A grid with a permanent grip on every column reads as chrome
     * rather than as data.
     */
    .grab {
      display: inline-grid;
      flex: 0 0 auto;
      width: max(1.5rem, var(--fluid-target-min, 0px));
      min-width: 0;
      height: max(1.5rem, var(--fluid-target-min, 0px));
      min-height: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(
        --fluid-infinite-table-grip-color,
        var(--fluid-text-secondary, #52525b)
      );
      opacity: 0;
      cursor: grab;
      place-items: center;
      transition: opacity 120ms ease;
    }
    .grab:hover {
      border: 0;
    }
    th:hover .grab,
    th:focus-within .grab,
    .grab[aria-pressed="true"] {
      opacity: 1;
    }
    .grab[aria-pressed="true"] {
      color: var(
        --fluid-infinite-table-grip-active-color,
        var(--fluid-accent-base, #4f46e5)
      );
      cursor: grabbing;
    }
    .grip {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: 0.9rem;
      cursor: col-resize;
      touch-action: none;
      user-select: none;
    }
    .grip::before {
      content: "";
      position: absolute;
      inset-block: 25%;
      inset-inline-end: 0.35rem;
      width: 2px;
      border-radius: var(--fluid-radius-sm, 0.25rem);
      background: var(
        --fluid-infinite-table-grip-color,
        var(--fluid-border-default, #e4e4e7)
      );
      transition: background-color 120ms ease, inset-block 120ms ease;
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
    th[data-drop]::after {
      content: "";
      position: absolute;
      inset-block: 0;
      width: 3px;
      background: var(
        --fluid-infinite-table-grip-active-color,
        var(--fluid-accent-base, #4f46e5)
      );
    }
    th[data-drop="start"]::after {
      inset-inline-start: 0;
    }
    th[data-drop="end"]::after {
      inset-inline-end: 0;
    }
    th[data-grabbed] {
      outline: var(--fluid-focus-ring-width, 2px) dashed
        var(--fluid-accent-base, #4f46e5);
      outline-offset: calc(-1 * var(--fluid-focus-ring-offset, 2px));
    }
    th[data-dragging] {
      opacity: 0.55;
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

  @state() private viewScrollTop = 0;
  @state() private viewportHeight = 800;
  @state() private internalLayout: FluidInfiniteTableLayoutItem[] = [];
  /** The column a keyboard user has picked up, if any. */
  @state() private grabbedKey: string | null = null;
  @state() private draggingKey: string | null = null;
  @state() private dropTarget: { key: string; edge: "start" | "end" } | null =
    null;
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

  private intersectionObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private frame = 0;
  private measureFrame = 0;
  /** Where a column sat before it was picked up, so Escape can put it back. */
  private grabSnapshot: FluidInfiniteTableLayoutItem[] | null = null;
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
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.measureFrame);
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
      this.scheduleMeasure();
    });
    if (this.viewport) this.resizeObserver.observe(this.viewport);
    if (this.toolbar) this.resizeObserver.observe(this.toolbar);
    this.viewport?.addEventListener("scroll", this.onContainerScroll, {
      passive: true
    });
  }

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

  private openColumns(): void {
    this.columnDialog?.showModal();
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
    const previous = column.style.width;
    table.setAttribute("data-measuring", "");
    column.style.width = "1px";
    let widest = 0;
    for (const row of table.querySelectorAll<HTMLElement>(
      "thead tr, tbody tr[data-row]"
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

  /** Puts `key` on the near or far side of `targetKey`, and reports it. */
  private reorderColumn(
    key: string,
    targetKey: string,
    edge: "start" | "end"
  ): void {
    if (key === targetKey || !this.canReorder(key) || !this.canReorder(targetKey)) {
      return;
    }
    const moved = this.internalLayout.find((item) => item.key === key);
    if (!moved) return;
    const next = this.internalLayout.filter((item) => item.key !== key);
    const at = next.findIndex((item) => item.key === targetKey);
    if (at < 0) return;
    next.splice(edge === "end" ? at + 1 : at, 0, moved);
    this.internalLayout = next.map((item, order) => ({ ...item, order }));
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
    event.dataTransfer?.setData("text/plain", key);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  }

  private onHeaderDragOver(event: DragEvent, key: string): void {
    const dragged = this.draggingKey;
    if (!dragged || dragged === key || !this.canReorder(key)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const cell = event.currentTarget as HTMLElement;
    const rect = cell.getBoundingClientRect();
    const past = (event.clientX - rect.left) / (rect.width || 1) > 0.5;
    const edge: "start" | "end" =
      (this.direction === 1 ? past : !past) ? "end" : "start";
    if (this.dropTarget?.key !== key || this.dropTarget.edge !== edge) {
      this.dropTarget = { key, edge };
    }
  }

  private onHeaderDrop(event: DragEvent, key: string): void {
    const dragged = this.draggingKey ?? event.dataTransfer?.getData("text/plain");
    const edge = this.dropTarget?.edge ?? "start";
    this.dropTarget = null;
    this.draggingKey = null;
    if (!dragged) return;
    event.preventDefault();
    this.reorderColumn(dragged, key, edge);
  }

  private readonly onDragEnd = (): void => {
    this.draggingKey = null;
    this.dropTarget = null;
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
          <span>${content}</span>
          <span class="sort-mark" aria-hidden="true">
            ${this.sort?.key === column.key
              ? this.sort.dir === "asc"
                ? "↑"
                : "↓"
              : "↕"}
          </span>
        </button>`
      : content;
  }

  /**
   * The header content, with whichever handles this column has earned.
   *
   * The handles sit beside the sort control rather than inside it: a grip
   * nested in a button is a button that cannot be pressed and a grip that
   * cannot be dragged.
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
              draggable="true"
              aria-pressed=${this.grabbedKey === column.key}
              aria-label=${this.label(this.reorderColumnLabel, {
                column: column.label
              })}
              @dragstart=${(event: DragEvent) =>
                this.onGrabDragStart(event, column.key)}
              @dragend=${this.onDragEnd}
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
              ${columns.map(
                (column) =>
                  html`<col
                    data-column=${column.key}
                    style=${column.width ? `width:${column.width}` : ""}
                  />`
              )}
            </colgroup>
            <thead>
              <tr part="header-row">
                ${columns.map(
                  (column) => html`
                    <th
                      part="header-cell"
                      scope="col"
                      data-column=${column.key}
                      data-drop=${this.dropTarget?.key === column.key
                        ? this.dropTarget.edge
                        : nothing}
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
                      @dragover=${(event: DragEvent) =>
                        this.onHeaderDragOver(event, column.key)}
                      @dragleave=${() => {
                        if (this.dropTarget?.key === column.key) {
                          this.dropTarget = null;
                        }
                      }}
                      @drop=${(event: DragEvent) =>
                        this.onHeaderDrop(event, column.key)}
                    >
                      ${this.renderHeaderContent(column)}
                    </th>
                  `
                )}
              </tr>
            </thead>
            <tbody>
              ${window.top
                ? html`<tr class="spacer" aria-hidden="true">
                    <td
                      colspan=${columns.length}
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
                  </tr>
                `
              )}
              ${window.bottom
                ? html`<tr class="spacer" aria-hidden="true">
                    <td
                      colspan=${columns.length}
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
