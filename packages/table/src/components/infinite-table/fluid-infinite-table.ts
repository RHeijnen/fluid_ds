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
 * @summary Infinite, windowed and template-driven semantic data table.
 *
 * @fires fluid-load-more - Requests the next result page.
 * @fires fluid-sort - Requests sorting. `detail: { key, dir }`.
 * @fires fluid-column-layout-change - Column visibility or order changed.
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

  @state() private viewScrollTop = 0;
  @state() private viewportHeight = 800;
  @state() private internalLayout: FluidInfiniteTableLayoutItem[] = [];

  @query(".viewport") private viewport?: HTMLElement;
  @query(".toolbar") private toolbar?: HTMLElement;
  @query(".sentinel") private sentinel?: HTMLElement;
  @query("dialog") private columnDialog?: HTMLDialogElement;

  private intersectionObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private frame = 0;

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
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this.observeGeometry();
    this.observeSentinel();
    this.onDocumentScroll();
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
                  html`<col style=${column.width ? `width:${column.width}` : ""} />`
              )}
            </colgroup>
            <thead>
              <tr part="header-row">
                ${columns.map(
                  (column) => html`
                    <th
                      part="header-cell"
                      scope="col"
                      aria-sort=${column.sortable
                        ? this.columnAriaSort(column)
                        : nothing}
                      style=${`--_cell-align:${column.align ?? "start"};`}
                    >
                      ${this.renderHeader(column)}
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
