import { html, css, nothing, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";
import { reducedMotion } from "@fluid-ds/components/internal/motion";
import "@fluid-ds/components/define/dropzone";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/callout";
import "../column-mapper/define.js";
import { parseFile } from "../../core/parse-file.js";
import { applyBlueprint } from "../../core/apply-blueprint.js";
import { toCSV, toJSON } from "../../core/export.js";
import type { Blueprint, CellError, ParseResult, RawTable } from "../../core/types.js";

/**
 * Drag a JSON / CSV / TSV / Excel file onto a Fluid file-drop and get
 * validated, typed rows out.
 *
 * The flow is: intake (a `fluid-dropzone`), then an auto-mapping step (a
 * `fluid-column-mapper` pre-filled by fuzzy match, with selects to override),
 * then a validated preview table with per-cell error highlighting, then a
 * confirm action. The cleaned, typed rows are emitted on `fluid-parse`, and the
 * cleaned data can be downloaded as CSV or JSON via {@link export}.
 *
 * Pass the target shape as a {@link Blueprint} on the `.blueprint` property.
 *
 * Accessibility: the dropzone is the keyboard-operable WAI-ARIA button intake;
 * the preview is a real semantic `<table>` with `<th scope>` headers and bad
 * cells carrying `aria-invalid` + a `title`; the validation summary is a
 * `fluid-callout` rendered into a `role="status"` / `aria-live="polite"` region
 * so it is announced when parsing finishes (errors use `role="alert"`).
 *
 * @summary Parse + validate a dropped data file against a blueprint.
 *
 * @csspart base - The outer container.
 * @csspart dropzone - The intake dropzone.
 * @csspart mapping - The column-mapping step wrapper.
 * @csspart summary - The validation summary region.
 * @csspart table - The preview table.
 * @csspart header-cell - A preview header cell.
 * @csspart cell - A preview body cell.
 * @csspart cell-invalid - A preview cell that failed validation.
 * @csspart actions - The confirm / reset action bar.
 *
 * Every styled property reads a `--fluid-parser-*` token that falls back to a
 * main semantic var (the override ladder).
 *
 * @cssproperty --fluid-parser-bg - Container background. Falls back to transparent.
 * @cssproperty --fluid-parser-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-parser-muted-fg - Secondary text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-parser-gap - Vertical rhythm between steps. Falls back to --fluid-space-4.
 * @cssproperty --fluid-parser-table-bg - Preview table background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-parser-table-header-bg - Preview header background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-parser-table-border - Preview table border. Falls back to --fluid-border-default.
 * @cssproperty --fluid-parser-table-radius - Preview table corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-parser-cell-padding - Preview cell padding. Falls back to 0.5rem 0.625rem.
 * @cssproperty --fluid-parser-invalid-bg - Invalid-cell background. Falls back to a tint of --fluid-danger-base.
 * @cssproperty --fluid-parser-invalid-fg - Invalid-cell text color. Falls back to --fluid-danger-text.
 * @cssproperty --fluid-parser-heading-fg - Step-heading color. Falls back to --fluid-text-primary.
 *
 * @uses-token --fluid-text-primary - Body text + headings.
 * @uses-token --fluid-text-secondary - Secondary text.
 * @uses-token --fluid-surface-base - Table background.
 * @uses-token --fluid-surface-muted - Table header background.
 * @uses-token --fluid-border-default - Table borders.
 * @uses-token --fluid-radius-md - Table radius.
 * @uses-token --fluid-danger-base - Invalid-cell highlight.
 * @uses-token --fluid-danger-text - Invalid-cell text.
 *
 * @fires fluid-file-loaded - A file was read into a raw table. detail: { file: File, raw: RawTable }.
 * @fires fluid-parse-error - Reading / parsing the file threw. detail: { file: File, message: string }.
 * @fires fluid-parse - The user confirmed. detail: { valid: boolean, rows, errors, mapping }.
 */
export class FluidFileParser extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        font-family: var(--fluid-font-family-sans);
        color: var(--fluid-parser-fg, var(--fluid-text-primary));
        background: var(--fluid-parser-bg, transparent);
      }
      :host([hidden]) {
        display: none;
      }
      .base {
        display: flex;
        flex-direction: column;
        gap: var(--fluid-parser-gap, var(--fluid-space-4));
      }
      .step-heading {
        margin: 0;
        font-size: var(--fluid-font-size-sm);
        font-weight: var(--fluid-font-weight-semibold, 600);
        color: var(--fluid-parser-heading-fg, var(--fluid-text-primary));
      }
      .step {
        display: flex;
        flex-direction: column;
        gap: var(--fluid-space-2);
      }
      .summary {
        display: block;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        border: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .table-scroll {
        overflow-x: auto;
        border: 1px solid var(--fluid-parser-table-border, var(--fluid-border-default));
        border-radius: var(--fluid-parser-table-radius, var(--fluid-radius-md));
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: var(--fluid-parser-table-bg, var(--fluid-surface-base));
        font-size: var(--fluid-font-size-sm);
      }
      caption {
        text-align: start;
        padding: var(--fluid-space-2);
        color: var(--fluid-parser-muted-fg, var(--fluid-text-secondary));
        font-size: var(--fluid-font-size-xs);
      }
      th,
      td {
        padding: var(--fluid-parser-cell-padding, 0.5rem 0.625rem);
        text-align: start;
        border-bottom: 1px solid var(--fluid-parser-table-border, var(--fluid-border-default));
        white-space: nowrap;
        max-width: 16rem;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      thead th {
        position: sticky;
        top: 0;
        background: var(--fluid-parser-table-header-bg, var(--fluid-surface-muted));
        font-weight: var(--fluid-font-weight-semibold, 600);
      }
      tbody tr:last-child td {
        border-bottom: 0;
      }
      td.invalid {
        background: var(
          --fluid-parser-invalid-bg,
          color-mix(in srgb, var(--fluid-danger-base) 14%, transparent)
        );
        color: var(--fluid-parser-invalid-fg, var(--fluid-danger-text));
      }
      .row-index {
        color: var(--fluid-parser-muted-fg, var(--fluid-text-secondary));
        font-variant-numeric: tabular-nums;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--fluid-space-2);
        align-items: center;
      }
      .actions .spacer {
        flex: 1 1 auto;
      }
    `
  ];

  @query("fluid-dropzone") private dropzoneEl?: HTMLElement & { clear: () => void };

  /** The target shape every row is mapped + coerced + validated against. */
  @property({ attribute: false }) blueprint: Blueprint = { fields: [] };

  /** Accepted file extensions for the intake dropzone. */
  @property() accept = ".csv,.tsv,.json,.xlsx,.xls";

  /** Prompt text shown inside the dropzone. */
  @property() label = "Drop a CSV, JSON, or Excel file here, or click to browse";

  /** Max rows shown in the preview table (the full result is still emitted). */
  @property({ type: Number, attribute: "preview-rows" }) previewRows = 50;

  /** Hide the column-mapping step (use the auto-map as-is). */
  @property({ type: Boolean, attribute: "hide-mapping" }) hideMapping = false;

  @state() private raw: RawTable | null = null;
  @state() private result: ParseResult | null = null;
  @state() private fileName = "";
  @state() private parseError = "";
  @state() private busy = false;

  /** The most recent parse result (after mapping), or null before a file loads. */
  get currentResult(): ParseResult | null {
    return this.result;
  }

  private async handleFiles(event: Event): Promise<void> {
    const detail = (event as CustomEvent<{ files: File[] }>).detail;
    const file = detail?.files?.[0];
    if (!file) return;
    this.parseError = "";
    this.busy = true;
    this.fileName = file.name;
    try {
      const raw = await parseFile(file, { headerRow: this.blueprint.headerRow ?? "auto" });
      this.raw = raw;
      this.recompute();
      this.dispatchEvent(
        new CustomEvent("fluid-file-loaded", {
          detail: { file, raw },
          bubbles: true,
          composed: true
        })
      );
    } catch (err) {
      const message = (err as Error).message || "Could not parse the file.";
      this.parseError = message;
      this.raw = null;
      this.result = null;
      this.dispatchEvent(
        new CustomEvent("fluid-parse-error", {
          detail: { file, message },
          bubbles: true,
          composed: true
        })
      );
    } finally {
      this.busy = false;
    }
  }

  private recompute(mapping?: Record<string, string | null>): void {
    if (!this.raw) return;
    this.result = applyBlueprint(this.raw, this.blueprint, mapping ? { mapping } : undefined);
  }

  private onMappingChange(event: Event): void {
    const detail = (event as CustomEvent<{ mapping: Record<string, string | null> }>).detail;
    if (detail?.mapping) this.recompute(detail.mapping);
  }

  private confirm(): void {
    if (!this.result) return;
    const valid = this.result.errors.length === 0;
    this.dispatchEvent(
      new CustomEvent("fluid-parse", {
        detail: {
          valid,
          rows: this.result.rows,
          errors: this.result.errors,
          mapping: this.result.mapping
        },
        bubbles: true,
        composed: true
      })
    );
  }

  /** Clear the loaded file + result and return to the intake step. */
  reset(): void {
    this.raw = null;
    this.result = null;
    this.fileName = "";
    this.parseError = "";
    this.dropzoneEl?.clear?.();
  }

  /**
   * Download the cleaned rows. Returns the serialized string too, so callers
   * that want their own download (or none) can use it directly.
   */
  export(format: "csv" | "json" = "csv"): string {
    const rows = this.result?.rows ?? [];
    const text = format === "json" ? toJSON(rows) : toCSV(rows, this.blueprint.fields);
    if (typeof document !== "undefined") {
      const mime = format === "json" ? "application/json" : "text/csv";
      const blob = new Blob([text], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const base = this.fileName.replace(/\.[^.]+$/, "") || "data";
      const link = document.createElement("a");
      link.href = url;
      link.download = `${base}.cleaned.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
    return text;
  }

  private renderSummary(result: ParseResult): TemplateResult {
    const { stats } = result;
    const hasErrors = stats.errorCount > 0;
    const parts: string[] = [`${stats.kept} of ${stats.total} rows ready`];
    if (stats.duplicates > 0) parts.push(`${stats.duplicates} duplicate(s) removed`);
    if (stats.truncated > 0) parts.push(`${stats.truncated} over the row cap`);
    const message = parts.join(", ");

    return html`
      <div
        part="summary"
        class="summary"
        role=${hasErrors ? "alert" : "status"}
        aria-live=${hasErrors ? "assertive" : "polite"}
      >
        <fluid-callout variant=${hasErrors ? "danger" : "success"}>
          <span slot="header">
            ${hasErrors ? `${stats.errorCount} cell error(s) found` : "All rows valid"}
          </span>
          ${message}
        </fluid-callout>
      </div>
    `;
  }

  private renderTable(result: ParseResult): TemplateResult {
    const fields = this.blueprint.fields;
    const rows = result.rows.slice(0, this.previewRows);
    // Index errors by "row:field" for O(1) cell lookup.
    const errorMap = new Map<string, CellError>();
    for (const error of result.errors) {
      errorMap.set(`${error.row}:${error.field}`, error);
    }

    return html`
      <div class="table-scroll">
        <table part="table">
          <caption>
            Preview of ${rows.length}${result.rows.length > rows.length ? ` of ${result.rows.length}` : ""}
            cleaned row(s). Highlighted cells failed validation.
          </caption>
          <thead>
            <tr>
              <th scope="col" class="row-index">#</th>
              ${fields.map(
                (field) => html`<th part="header-cell" scope="col">${field.label ?? field.key}</th>`
              )}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => {
              const realIndex = index; // preview slice starts at 0 = result row 0
              return html`
                <tr>
                  <td class="row-index">${realIndex + 1}</td>
                  ${fields.map((field) => {
                    const error = errorMap.get(`${realIndex}:${field.key}`);
                    const value = row[field.key];
                    const display = value === null || value === undefined ? "" : String(value);
                    return html`
                      <td
                        part=${error ? "cell-invalid" : "cell"}
                        class=${error ? "invalid" : ""}
                        title=${error ? error.message : display}
                        aria-invalid=${error ? "true" : "false"}
                      >
                        ${display}
                      </td>
                    `;
                  })}
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  override render(): TemplateResult {
    const loaded = this.raw !== null && this.result !== null;
    return html`
      <div part="base" class="base">
        <fluid-dropzone
          part="dropzone"
          accept=${this.accept}
          label=${this.label}
          ?disabled=${this.busy}
          @fluid-change=${this.handleFiles}
        ></fluid-dropzone>

        ${this.parseError
          ? html`
              <div role="alert" aria-live="assertive">
                <fluid-callout variant="danger">
                  <span slot="header">Could not read ${this.fileName || "the file"}</span>
                  ${this.parseError}
                </fluid-callout>
              </div>
            `
          : nothing}

        ${loaded && this.result
          ? html`
              ${!this.hideMapping
                ? html`
                    <div part="mapping" class="step">
                      <p class="step-heading">Map columns</p>
                      <fluid-column-mapper
                        .blueprint=${this.blueprint}
                        .columns=${this.raw?.columns ?? []}
                        .mapping=${this.result.mapping}
                        @fluid-mapping-change=${this.onMappingChange}
                      ></fluid-column-mapper>
                    </div>
                  `
                : nothing}

              <div class="step">
                <p class="step-heading">Preview</p>
                ${this.renderSummary(this.result)} ${this.renderTable(this.result)}
              </div>

              <div part="actions" class="actions">
                <fluid-button variant="primary" @click=${this.confirm}>
                  Import ${this.result.stats.kept} row(s)
                </fluid-button>
                <fluid-button variant="ghost" @click=${() => this.export("csv")}>
                  Download CSV
                </fluid-button>
                <fluid-button variant="ghost" @click=${() => this.export("json")}>
                  Download JSON
                </fluid-button>
                <span class="spacer"></span>
                <fluid-button variant="ghost" @click=${this.reset}>Reset</fluid-button>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}
