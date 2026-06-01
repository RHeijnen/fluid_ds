import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";
import { reducedMotion } from "@fluid-ds/components/internal/motion";
import { autoMap } from "../../core/mapping.js";
import type { Blueprint } from "../../core/types.js";

/**
 * Map source columns to blueprint fields.
 *
 * Given a `blueprint` and the list of `columns` read from a file, it shows one
 * row per field with a `<select>` of the available source columns, pre-filled
 * from the fuzzy auto-map. Changing any select emits `fluid-mapping-change`
 * with the full `{ fieldKey -> column | null }` map. Usable on its own or
 * inside `<fluid-file-parser>`.
 *
 * Semantics: a plain list of labelled native `<select>` controls (the WAI-ARIA
 * native-select pattern), so keyboard + screen-reader support comes for free.
 * Each select's accessible name is its field label via a real `<label for>`.
 *
 * @summary Map source columns to blueprint fields.
 *
 * @csspart base - The outer container.
 * @csspart row - One field-to-column mapping row.
 * @csspart label - A field's label.
 * @csspart select - A source-column select.
 * @csspart required - The required-field marker.
 *
 * Every styled property reads a `--fluid-mapper-*` token that falls back to a
 * main semantic var (the override ladder).
 *
 * @cssproperty --fluid-mapper-bg - Container background. Falls back to transparent.
 * @cssproperty --fluid-mapper-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-mapper-label-fg - Field-label color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-mapper-muted-fg - Secondary / required-marker color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-mapper-border - Select border. Falls back to --fluid-border-default.
 * @cssproperty --fluid-mapper-select-bg - Select background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-mapper-radius - Select corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-mapper-gap - Row gap. Falls back to --fluid-space-3.
 * @cssproperty --fluid-mapper-danger - Unmapped-required highlight. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-mapper-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 *
 * @uses-token --fluid-text-primary - Field labels + values.
 * @uses-token --fluid-text-secondary - Secondary text + required marker.
 * @uses-token --fluid-border-default - Select border.
 * @uses-token --fluid-surface-base - Select background.
 * @uses-token --fluid-radius-md - Select radius.
 * @uses-token --fluid-danger-base - Unmapped-required highlight.
 * @uses-token --fluid-focus-ring-color - Keyboard focus ring.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-target-min - Minimum interactive-target size (24px AA / 44px AAA).
 *
 * @fires fluid-mapping-change - The mapping changed. detail: { mapping: Record<string, string | null> }.
 */
export class FluidColumnMapper extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        font-family: var(--fluid-font-family-sans);
        color: var(--fluid-mapper-fg, var(--fluid-text-primary));
        background: var(--fluid-mapper-bg, transparent);
      }
      :host([hidden]) {
        display: none;
      }
      .base {
        display: flex;
        flex-direction: column;
        gap: var(--fluid-mapper-gap, var(--fluid-space-3));
      }
      .row {
        display: grid;
        grid-template-columns: minmax(8rem, 1fr) minmax(8rem, 1.4fr);
        gap: var(--fluid-space-3);
        align-items: center;
      }
      @media (max-width: 30rem) {
        .row {
          grid-template-columns: 1fr;
          gap: var(--fluid-space-1);
        }
      }
      .label {
        font-size: var(--fluid-font-size-sm);
        font-weight: var(--fluid-font-weight-medium);
        color: var(--fluid-mapper-label-fg, var(--fluid-text-primary));
      }
      .required {
        margin-inline-start: 0.25rem;
        color: var(--fluid-mapper-muted-fg, var(--fluid-text-secondary));
      }
      select {
        box-sizing: border-box;
        width: 100%;
        min-height: max(2.25rem, var(--fluid-target-min, 0px));
        padding: var(--fluid-space-1) var(--fluid-space-2);
        font: inherit;
        font-size: var(--fluid-font-size-sm);
        color: var(--fluid-mapper-fg, var(--fluid-text-primary));
        background: var(--fluid-mapper-select-bg, var(--fluid-surface-base));
        border: 1px solid var(--fluid-mapper-border, var(--fluid-border-default));
        border-radius: var(--fluid-mapper-radius, var(--fluid-radius-md));
      }
      select:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-mapper-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: var(--fluid-focus-ring-offset, 2px);
      }
      .row[data-unmapped] select {
        border-color: var(--fluid-mapper-danger, var(--fluid-danger-base));
      }
    `
  ];

  /** The blueprint whose fields are the mapping targets. */
  @property({ attribute: false }) blueprint: Blueprint = { fields: [] };

  /** Source column names available to map from. */
  @property({ type: Array }) columns: string[] = [];

  /** Current mapping. Two-way: set it to control, or read it after a change. */
  @property({ attribute: false }) mapping: Record<string, string | null> = {};

  override willUpdate(changed: Map<string, unknown>): void {
    // Seed the mapping from the fuzzy auto-map whenever columns / blueprint
    // arrive and no mapping has been supplied yet.
    if ((changed.has("columns") || changed.has("blueprint")) && this.columns.length > 0) {
      const hasMapping = Object.keys(this.mapping).length > 0;
      if (!hasMapping) {
        this.mapping = autoMap(this.columns, this.blueprint);
      }
    }
  }

  private onSelect(fieldKey: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value === "" ? null : select.value;
    this.mapping = { ...this.mapping, [fieldKey]: value };
    this.dispatchEvent(
      new CustomEvent("fluid-mapping-change", {
        detail: { mapping: { ...this.mapping } },
        bubbles: true,
        composed: true
      })
    );
  }

  override render(): TemplateResult {
    const fields = this.blueprint.fields ?? [];
    return html`
      <div part="base" class="base">
        ${fields.map((field) => {
          const selected = this.mapping[field.key] ?? "";
          const unmapped = field.required && selected === "";
          const selectId = `map-${field.key}`;
          return html`
            <div part="row" class="row" ?data-unmapped=${unmapped}>
              <label part="label" class="label" for=${selectId}>
                ${field.label ?? field.key}
                ${field.required
                  ? html`<span part="required" class="required" title="Required">*</span>`
                  : ""}
              </label>
              <select
                part="select"
                id=${selectId}
                .value=${selected}
                aria-invalid=${unmapped ? "true" : "false"}
                @change=${(e: Event) => this.onSelect(field.key, e)}
              >
                <option value="">${field.required ? "Select a column…" : "(not mapped)"}</option>
                ${this.columns.map(
                  (col) => html`<option value=${col} ?selected=${col === selected}>${col}</option>`
                )}
              </select>
            </div>
          `;
        })}
      </div>
    `;
  }
}
