import { html, css, nothing, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";
import { reducedMotion } from "@fluid-ds/components/internal/motion";
import "@fluid-ds/components/define/dropzone";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/callout";
import "../column-mapper/define.js";
import { parseFile, ParserFileError } from "../../core/parse-file.js";
import { applyBlueprint } from "../../core/apply-blueprint.js";
import { toCSV, toJSON } from "../../core/export.js";
import type {
  Blueprint,
  CellError,
  ParseResult,
  ParserDiagnostic,
  RawTable
} from "../../core/types.js";

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
 * `fluid-callout` whose native status/alert semantics announce parsing results.
 * Do not wrap it in a second live region, which duplicates announcements.
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

  private labelOverride: string | null = null;

  /** Prompt text shown inside the dropzone. An explicit empty string remains empty. */
  @property()
  get label(): string {
    return this.labelOverride ?? this.term("parserDropFile");
  }

  set label(value: string | null) {
    this.labelOverride = value;
  }

  /** Max rows shown in the preview table (the full result is still emitted). */
  @property({ type: Number, attribute: "preview-rows" }) previewRows = 50;

  /** Hide the column-mapping step (use the auto-map as-is). */
  @property({ type: Boolean, attribute: "hide-mapping" }) hideMapping = false;

  @state() private raw: RawTable | null = null;
  @state() private result: ParseResult | null = null;
  @state() private fileName = "";
  @state() private parseError = "";
  @state() private parseErrorDiagnostic: ParserFileError | null = null;
  @state() private parseErrorUsesFallback = false;
  @state() private busy = false;
  private readGeneration = 0;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.readGeneration++;
    this.busy = false;
  }

  /** The most recent parse result (after mapping), or null before a file loads. */
  get currentResult(): ParseResult | null {
    return this.result;
  }

  private async handleFiles(event: Event): Promise<void> {
    const detail = (event as CustomEvent<{ files: File[] }>).detail;
    const file = detail?.files?.[0];
    if (!file) {
      if (detail?.files) this.reset();
      return;
    }
    const generation = ++this.readGeneration;
    this.parseError = "";
    this.parseErrorDiagnostic = null;
    this.parseErrorUsesFallback = false;
    this.busy = true;
    this.raw = null;
    this.result = null;
    this.fileName = file.name;
    try {
      const raw = await parseFile(file, { headerRow: this.blueprint.headerRow ?? "auto" });
      if (generation !== this.readGeneration || !this.isConnected) return;
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
      if (generation !== this.readGeneration || !this.isConnected) return;
      const rawMessage = err instanceof Error ? err.message : String(err ?? "");
      const message = rawMessage || "Could not parse the file.";
      this.parseError = message;
      this.parseErrorDiagnostic = err instanceof ParserFileError ? err : null;
      this.parseErrorUsesFallback = rawMessage.length === 0;
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
      if (generation === this.readGeneration) this.busy = false;
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
    if (!this.result || this.busy) return;
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
    const restoreIntakeFocus = (this.getRootNode() as Document | ShadowRoot).activeElement === this;
    this.readGeneration++;
    this.busy = false;
    this.raw = null;
    this.result = null;
    this.fileName = "";
    this.parseError = "";
    this.parseErrorDiagnostic = null;
    this.parseErrorUsesFallback = false;
    this.dropzoneEl?.clear?.();
    if (restoreIntakeFocus) {
      void this.updateComplete.then(() => {
        if (this.isConnected) this.dropzoneEl?.shadowRoot?.querySelector<HTMLElement>('[role="button"]')?.focus();
      });
    }
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

  private formatNumber(value: number): string {
    return new Intl.NumberFormat(this.localize.locale).format(value);
  }

  private localizedFileError(): string {
    const diagnostic = this.parseErrorDiagnostic;
    if (diagnostic?.code === "invalidJsonSyntax") {
      return this.term("parserInvalidJsonSyntax", diagnostic.parameters.reason);
    }
    if (diagnostic?.code === "invalidJsonShape") return this.term("parserInvalidJsonShape");
    if (this.parseErrorUsesFallback) return this.term("parserCouldNotParseFile");
    return this.parseError;
  }

  private localizedCellError(error: CellError): string {
    const diagnostic = error.diagnostic;
    if (!diagnostic || diagnostic.code === "customValidation") return error.message;
    return this.localizedDiagnostic(diagnostic);
  }

  private localizedDiagnostic(diagnostic: Exclude<ParserDiagnostic, { code: "customValidation" }>): string {
    switch (diagnostic.code) {
      case "required":
        return this.term("parserFieldRequired", diagnostic.parameters.label);
      case "stringTooShort":
        return this.term(
          "parserStringTooShort",
          diagnostic.parameters.label,
          this.formatNumber(diagnostic.parameters.minimum)
        );
      case "stringTooLong":
        return this.term(
          "parserStringTooLong",
          diagnostic.parameters.label,
          this.formatNumber(diagnostic.parameters.maximum)
        );
      case "patternMismatch":
        return this.term("parserPatternMismatch", diagnostic.parameters.label);
      case "invalidNumber":
        return this.term(
          "parserInvalidNumber",
          diagnostic.parameters.label,
          diagnostic.parameters.value
        );
      case "invalidInteger":
        return this.term(
          "parserInvalidInteger",
          diagnostic.parameters.label,
          diagnostic.parameters.value
        );
      case "numberBelowMinimum":
        return this.term(
          "parserNumberBelowMinimum",
          diagnostic.parameters.label,
          this.formatNumber(diagnostic.parameters.minimum)
        );
      case "numberAboveMaximum":
        return this.term(
          "parserNumberAboveMaximum",
          diagnostic.parameters.label,
          this.formatNumber(diagnostic.parameters.maximum)
        );
      case "invalidBoolean":
        return this.term(
          "parserInvalidBoolean",
          diagnostic.parameters.label,
          diagnostic.parameters.value
        );
      case "invalidDate":
        return this.term(
          "parserInvalidDate",
          diagnostic.parameters.label,
          diagnostic.parameters.value
        );
      case "dateBeforeMinimum":
        return this.term("parserDateBeforeMinimum", diagnostic.parameters.label);
      case "dateAfterMaximum":
        return this.term("parserDateAfterMaximum", diagnostic.parameters.label);
      case "invalidEmail":
        return this.term(
          "parserInvalidEmail",
          diagnostic.parameters.label,
          diagnostic.parameters.value
        );
      case "invalidUrl":
        return this.term(
          "parserInvalidUrl",
          diagnostic.parameters.label,
          diagnostic.parameters.value
        );
      case "invalidEnum":
        return this.term(
          "parserInvalidEnum",
          diagnostic.parameters.label,
          diagnostic.parameters.options.map(String).join(", ")
        );
      case "invalidJson":
        return this.term("parserInvalidJson", diagnostic.parameters.label);
      case "unmappedRequired":
        return this.term("parserUnmappedRequired", diagnostic.parameters.label);
      case "transformFailed":
        return this.term(
          "parserTransformFailed",
          diagnostic.parameters.label,
          diagnostic.parameters.reason
        );
    }
  }

  private renderSummary(result: ParseResult): TemplateResult {
    const { stats } = result;
    const hasErrors = stats.errorCount > 0;
    const message = this.term(
      "parserReadySummary",
      stats.kept,
      stats.total,
      stats.duplicates,
      stats.truncated,
      this.formatNumber(stats.kept),
      this.formatNumber(stats.total),
      this.formatNumber(stats.duplicates),
      this.formatNumber(stats.truncated)
    );

    return html`
      <div
        part="summary"
        class="summary"
      >
        <fluid-callout variant=${hasErrors ? "danger" : "success"}>
          <span slot="header">
            ${hasErrors
              ? this.term(
                  "parserCellErrorsFound",
                  stats.errorCount,
                  this.formatNumber(stats.errorCount)
                )
              : this.term("parserAllRowsValid")}
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
            ${this.term(
              "parserPreviewCaption",
              rows.length,
              this.formatNumber(rows.length),
              result.rows.length,
              this.formatNumber(result.rows.length)
            )}
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
                  <td class="row-index">${this.formatNumber(realIndex + 1)}</td>
                  ${fields.map((field) => {
                    const error = errorMap.get(`${realIndex}:${field.key}`);
                    const value = row[field.key];
                    const display = value === null || value === undefined ? "" : String(value);
                    return html`
                      <td
                        part=${error ? "cell-invalid" : "cell"}
                        class=${error ? "invalid" : ""}
                        title=${error ? this.localizedCellError(error) : display}
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
      <div
        part="base"
        class="base"
        dir=${this.localize.dir}
        aria-busy=${this.busy ? "true" : "false"}
      >
        <fluid-dropzone
          part="dropzone"
          accept=${this.accept}
          label=${this.label}
          ?disabled=${this.busy}
          @fluid-change=${this.handleFiles}
        ></fluid-dropzone>

        ${this.parseError
          ? html`
              <div>
                <fluid-callout variant="danger">
                  <span slot="header">${this.term("parserCouldNotReadFile", this.fileName)}</span>
                  ${this.localizedFileError()}
                </fluid-callout>
              </div>
            `
          : nothing}

        ${loaded && this.result
          ? html`
              ${!this.hideMapping
                ? html`
                    <div part="mapping" class="step">
                      <p class="step-heading">${this.term("parserMapColumns")}</p>
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
                <p class="step-heading">${this.term("parserPreview")}</p>
                ${this.renderSummary(this.result)} ${this.renderTable(this.result)}
              </div>

              <div part="actions" class="actions">
                <fluid-button variant="primary" @click=${this.confirm}>
                  ${this.term(
                    "parserImportRows",
                    this.result.stats.kept,
                    this.formatNumber(this.result.stats.kept)
                  )}
                </fluid-button>
                <fluid-button variant="ghost" @click=${() => this.export("csv")}>
                  ${this.term("parserDownloadFormat", "CSV")}
                </fluid-button>
                <fluid-button variant="ghost" @click=${() => this.export("json")}>
                  ${this.term("parserDownloadFormat", "JSON")}
                </fluid-button>
                <span class="spacer"></span>
                <fluid-button variant="ghost" @click=${this.reset}>
                  ${this.term("parserReset")}
                </fluid-button>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}
