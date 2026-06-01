import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";

/** A single column definition. */
export interface FluidTableColumn {
  /** Object key this column reads from each row. */
  key: string;
  /** Visible header label. */
  label: string;
  /** When true, the header renders a sort button and toggles aria-sort. */
  sortable?: boolean;
  /** Cell + header text alignment. Defaults to "start". */
  align?: "start" | "center" | "end";
}

/** A row is a plain object keyed by column.key (plus an optional stable "id"). */
export type FluidTableRow = Record<string, unknown>;

/** Current sort state, or null for unsorted. */
export interface FluidTableSort {
  key: string;
  dir: "asc" | "desc";
}

/**
 * An accessible data table. Renders a real semantic `<table>` with a
 * `<caption>`, `<th scope="col">` headers, and a `<tbody>` of rows driven by
 * the `columns` and `rows` properties. Sortable columns get a header `<button>`
 * that toggles the sort and sets `aria-sort` on the `<th>`; sorting is
 * string + numeric aware and happens internally. When `selectable`, a leading
 * column adds a "select all" header checkbox and per-row checkboxes.
 *
 * Rows are tracked by a stable key: the row's `id` field when present, else its
 * index. Selection and sort are surfaced as events so a host can persist them.
 *
 * This is a static data table (the WAI-ARIA Table pattern), not an interactive
 * Grid: cells are not individually focusable, Tab moves between the controls in
 * the header and the selection checkboxes, and native table semantics carry the
 * rest.
 *
 * @summary Accessible, sortable, selectable data table.
 *
 * @csspart base - The `<table>` element.
 * @csspart caption - The table caption.
 * @csspart header-row - The header `<tr>`.
 * @csspart header-cell - Each header `<th>`.
 * @csspart sort-button - The sort toggle button inside a sortable header.
 * @csspart row - Each body `<tr>`.
 * @csspart cell - Each body `<td>`.
 * @csspart select-all - The select-all header checkbox.
 * @csspart select-row - A per-row selection checkbox.
 *
 * @cssproperty --fluid-table-bg - Table background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-table-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-table-header-bg - Header row background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-table-header-fg - Header text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-table-border - Cell border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-table-row-hover-bg - Row hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-table-selected-bg - Selected row background. Falls back to a tint of --fluid-accent-base.
 * @cssproperty --fluid-table-zebra-bg - Zebra (odd-row) background. Falls back to transparent (off).
 * @cssproperty --fluid-table-radius - Outer corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-table-cell-padding - Cell padding. Falls back to 0.625rem 0.75rem.
 *
 * @uses-token --fluid-surface-base - Table background.
 * @uses-token --fluid-surface-muted - Header + hover background.
 * @uses-token --fluid-text-primary - Text color.
 * @uses-token --fluid-text-secondary - Caption color.
 * @uses-token --fluid-border-default - Cell borders.
 * @uses-token --fluid-accent-base - Selection tint + focus ring.
 * @uses-token --fluid-radius-md - Outer radius.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum interactive target (24px AA / 44px AAA).
 *
 * @fires fluid-sort - The sort changed. `detail: { key, dir }`.
 * @fires fluid-selection-change - The row selection changed. `detail: { selected: rowKeys[] }`.
 */
export class FluidTable extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans, system-ui, sans-serif);
      color: var(--fluid-table-fg, var(--fluid-text-primary, #18181b));
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--fluid-table-bg, var(--fluid-surface-base, #fff));
      border: 1px solid var(--fluid-table-border, var(--fluid-border-default, #e4e4e7));
      border-radius: var(--fluid-table-radius, var(--fluid-radius-md, 0.5rem));
      overflow: hidden;
      font-size: var(--fluid-font-size-sm, 0.875rem);
    }
    caption {
      caption-side: top;
      text-align: start;
      padding: var(--fluid-table-cell-padding, 0.625rem 0.75rem);
      color: var(--fluid-text-secondary, #3f3f46);
      font-weight: 600;
    }
    caption.sr-only {
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
      padding: var(--fluid-table-cell-padding, 0.625rem 0.75rem);
      border-bottom: 1px solid var(--fluid-table-border, var(--fluid-border-default, #e4e4e7));
      text-align: var(--cell-align, start);
      vertical-align: middle;
    }
    thead th {
      background: var(--fluid-table-header-bg, var(--fluid-surface-muted, #f4f4f5));
      color: var(--fluid-table-header-fg, var(--fluid-text-primary, #18181b));
      font-weight: 600;
      white-space: nowrap;
    }
    tbody tr:last-child td {
      border-bottom: 0;
    }
    tbody tr:nth-child(odd) td {
      background: var(--fluid-table-zebra-bg, transparent);
    }
    tbody tr:hover td {
      background: var(--fluid-table-row-hover-bg, var(--fluid-surface-muted, #f4f4f5));
    }
    tbody tr[data-selected] td {
      background: var(
        --fluid-table-selected-bg,
        color-mix(in srgb, var(--fluid-accent-base, #4f46e5) 12%, transparent)
      );
    }
    .select-col {
      width: 1px;
      white-space: nowrap;
      text-align: center;
    }
    .sort-button {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: max(1.5rem, var(--fluid-target-min, 0px));
      padding: 0;
      margin: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .sort-button:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base, #4f46e5);
      outline-offset: 2px;
      border-radius: 2px;
    }
    .sort-icon {
      width: 1em;
      height: 1em;
      flex: none;
      opacity: 0.4;
      transition: opacity 120ms ease, transform 120ms ease;
    }
    th[aria-sort="ascending"] .sort-icon {
      opacity: 1;
    }
    th[aria-sort="descending"] .sort-icon {
      opacity: 1;
      transform: rotate(180deg);
    }
    input[type="checkbox"] {
      width: max(1rem, var(--fluid-target-min, 0px));
      height: max(1rem, var(--fluid-target-min, 0px));
      accent-color: var(--fluid-accent-base, #4f46e5);
      cursor: pointer;
      margin: 0;
    }
    input[type="checkbox"]:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base, #4f46e5);
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      .sort-icon {
        transition: none;
      }
    }
  `;

  /** Column definitions. */
  @property({ type: Array }) columns: FluidTableColumn[] = [];

  /** Row data, each a plain object keyed by column.key. */
  @property({ type: Array }) rows: FluidTableRow[] = [];

  /** Show a leading selection column with checkboxes. */
  @property({ type: Boolean }) selectable = false;

  /** Current sort, or null for the rows' natural order. */
  @property({ type: Object }) sort: FluidTableSort | null = null;

  /** Visible (or screen-reader-only) table caption. */
  @property({ type: String }) caption = "";

  /** When true, the caption is present for AT but visually hidden. */
  @property({ type: Boolean, attribute: "hide-caption" }) hideCaption = false;

  /** Selected row keys. */
  private selected = new Set<string>();

  /** Stable key for a row: its "id" field when present, else its index. */
  private rowKey(row: FluidTableRow, index: number): string {
    const id = row["id"];
    if (typeof id === "string" || typeof id === "number") return String(id);
    return String(index);
  }

  /** Rows in the order they should render, applying the current sort. */
  private get sortedRows(): FluidTableRow[] {
    const sort = this.sort;
    if (!sort) return this.rows;
    const { key, dir } = sort;
    const factor = dir === "desc" ? -1 : 1;
    return [...this.rows].sort((a, b) => factor * this.compare(a[key], b[key]));
  }

  /** String + numeric aware comparison. Nullish values sort last. */
  private compare(a: unknown, b: unknown): number {
    const aNull = a == null || a === "";
    const bNull = b == null || b === "";
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    const an = typeof a === "number" ? a : Number(a);
    const bn = typeof b === "number" ? b : Number(b);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  }

  private ariaSortFor(col: FluidTableColumn): "ascending" | "descending" | "none" {
    if (!col.sortable) return "none";
    if (this.sort?.key !== col.key) return "none";
    return this.sort.dir === "asc" ? "ascending" : "descending";
  }

  private onSort(col: FluidTableColumn): void {
    if (!col.sortable) return;
    let dir: "asc" | "desc" = "asc";
    if (this.sort?.key === col.key) {
      dir = this.sort.dir === "asc" ? "desc" : "asc";
    }
    this.sort = { key: col.key, dir };
    this.dispatchEvent(
      new CustomEvent("fluid-sort", { detail: { key: col.key, dir }, bubbles: true, composed: true })
    );
  }

  private emitSelection(): void {
    this.dispatchEvent(
      new CustomEvent("fluid-selection-change", {
        detail: { selected: [...this.selected] },
        bubbles: true,
        composed: true
      })
    );
  }

  private allKeys(): string[] {
    return this.rows.map((row, i) => this.rowKey(row, i));
  }

  private toggleRow(key: string, checked: boolean): void {
    if (checked) this.selected.add(key);
    else this.selected.delete(key);
    this.requestUpdate();
    this.emitSelection();
  }

  private toggleAll(checked: boolean): void {
    this.selected = checked ? new Set(this.allKeys()) : new Set();
    this.requestUpdate();
    this.emitSelection();
  }

  /** Programmatically read the selected row keys. */
  get selectedKeys(): string[] {
    return [...this.selected];
  }

  private renderSortIcon(): TemplateResult {
    return html`<svg
      class="sort-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m18 15-6-6-6 6"></path>
    </svg>`;
  }

  override render(): TemplateResult {
    const cols = this.columns;
    const rows = this.sortedRows;
    const keys = this.allKeys();
    const allSelected = keys.length > 0 && keys.every((k) => this.selected.has(k));
    const someSelected = keys.some((k) => this.selected.has(k));

    return html`
      <table part="base">
        ${this.caption
          ? html`<caption part="caption" class=${this.hideCaption ? "sr-only" : ""}>
              ${this.caption}
            </caption>`
          : nothing}
        <thead>
          <tr part="header-row">
            ${this.selectable
              ? html`<th class="select-col" scope="col">
                  <input
                    part="select-all"
                    type="checkbox"
                    aria-label="Select all rows"
                    .checked=${allSelected}
                    .indeterminate=${someSelected && !allSelected}
                    @change=${(e: Event) => this.toggleAll((e.target as HTMLInputElement).checked)}
                  />
                </th>`
              : nothing}
            ${cols.map((col) => {
              const align = col.align ?? "start";
              const ariaSort = this.ariaSortFor(col);
              return html`<th
                part="header-cell"
                scope="col"
                aria-sort=${col.sortable ? ariaSort : nothing}
                style=${`--cell-align:${align};`}
              >
                ${col.sortable
                  ? html`<button
                      part="sort-button"
                      class="sort-button"
                      type="button"
                      @click=${() => this.onSort(col)}
                    >
                      ${col.label}${this.renderSortIcon()}
                    </button>`
                  : col.label}
              </th>`;
            })}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const naturalIndex = this.rows.indexOf(row);
            const key = this.rowKey(row, naturalIndex);
            const isSelected = this.selected.has(key);
            return html`<tr part="row" ?data-selected=${isSelected}>
              ${this.selectable
                ? html`<td class="select-col">
                    <input
                      part="select-row"
                      type="checkbox"
                      aria-label=${`Select row ${naturalIndex + 1}`}
                      .checked=${isSelected}
                      @change=${(e: Event) => this.toggleRow(key, (e.target as HTMLInputElement).checked)}
                    />
                  </td>`
                : nothing}
              ${cols.map((col) => {
                const value = row[col.key];
                const align = col.align ?? "start";
                return html`<td part="cell" style=${`--cell-align:${align};`}>
                  ${value == null ? "" : String(value)}
                </td>`;
              })}
            </tr>`;
          })}
        </tbody>
      </table>
    `;
  }
}
