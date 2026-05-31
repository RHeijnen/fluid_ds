import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Format a byte count for display. Wraps `Intl.NumberFormat` with `unit`
 * style so output respects the current locale (e.g. "1.2 MB" or "1,2 MB"
 * in fr-FR).
 *
 * @summary Localized byte size formatter.
 *
 * @cssproperty --fluid-format-bytes-color - Text color.
 */
export class FluidFormatBytes extends FluidElement {
  static override styles = css`
    :host {
      display: inline;
      color: var(--fluid-format-bytes-color, inherit);
    }
  `;

  /** The byte count to format. */
  @property({ type: Number }) value = 0;

  /** Use binary (1024) or decimal (1000) units. */
  @property() unit: "byte" | "bit" = "byte";

  /** Notation style. */
  @property() display: "short" | "long" | "narrow" = "short";

  /** BCP 47 locale tag, or omit to use the browser default. */
  @property() locale: string | null = null;

  /** Display style, binary (KiB, MiB) or decimal (KB, MB). */
  @property() base: "binary" | "decimal" = "decimal";

  override render(): TemplateResult {
    const factor = this.base === "binary" ? 1024 : 1000;
    const units =
      this.unit === "bit"
        ? ["bit", "kilobit", "megabit", "gigabit", "terabit"]
        : ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"];
    let value = Math.abs(this.value);
    let i = 0;
    while (value >= factor && i < units.length - 1) {
      value /= factor;
      i++;
    }
    const sign = this.value < 0 ? -1 : 1;
    const unit = units[i];
    if (!unit) return html``;
    const formatter = new Intl.NumberFormat(this.locale ?? undefined, {
      style: "unit",
      unit,
      unitDisplay: this.display,
      maximumFractionDigits: i === 0 ? 0 : 1
    });
    return html`${formatter.format(sign * value)}`;
  }
}
