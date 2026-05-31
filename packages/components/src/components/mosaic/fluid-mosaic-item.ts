import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidMosaicSize = "normal" | "wide" | "tall" | "large";

/** Preset size → [colSpan, rowSpan]. */
const SIZE_SPANS: Record<FluidMosaicSize, [number, number]> = {
  normal: [1, 1],
  wide: [2, 1],
  tall: [1, 2],
  large: [2, 2]
};

/**
 * A tile inside [`<fluid-mosaic>`](/components/mosaic/). Pick a `size` preset
 * (`normal` · `wide` · `tall` · `large`) or set explicit `col-span` /
 * `row-span`, which override the preset.
 *
 * @summary A spanning tile inside `<fluid-mosaic>`.
 *
 * @slot - The tile content.
 */
export class FluidMosaicItem extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
      overflow: hidden;
      grid-column: span var(--_col-span, 1);
      grid-row: span var(--_row-span, 1);
    }

    :host([hidden]) {
      display: none;
    }
  `;

  /** Preset size. `col-span` / `row-span` override the matching axis. */
  @property({ reflect: true }) size: FluidMosaicSize = "normal";

  /** Explicit column span (overrides the `size` preset's column span). */
  @property({ type: Number, attribute: "col-span" }) colSpan?: number;

  /** Explicit row span (overrides the `size` preset's row span). */
  @property({ type: Number, attribute: "row-span" }) rowSpan?: number;

  private setVar(name: string, value: string | number | undefined | null): void {
    if (value === undefined || value === null || value === "") this.style.removeProperty(name);
    else this.style.setProperty(name, String(value));
  }

  protected override updated(): void {
    const [presetCol, presetRow] = SIZE_SPANS[this.size] ?? SIZE_SPANS.normal;
    this.setVar("--_col-span", this.colSpan ?? presetCol);
    this.setVar("--_row-span", this.rowSpan ?? presetRow);
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
