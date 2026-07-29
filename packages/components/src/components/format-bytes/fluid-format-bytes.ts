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

  /** Measure in bytes or bits. */
  @property() unit: "byte" | "bit" = "byte";

  /** Notation style. */
  @property() display: "short" | "long" | "narrow" = "short";

  /** BCP 47 locale tag, or omit to use the browser default. */
  @property() locale: string | null = null;

  /** Display style, binary (KiB, MiB) or decimal (KB, MB). */
  @property() base: "binary" | "decimal" = "decimal";

  override render(): TemplateResult {
    return html`${this.base === "binary"
      ? this.formatBinary()
      : this.formatDecimal()}`;
  }

  /** Decimal (SI) base: 1000-based with locale-aware Intl unit names. */
  private formatDecimal(): string {
    const units =
      this.unit === "bit"
        ? ["bit", "kilobit", "megabit", "gigabit", "terabit"]
        : ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"];
    let value = Math.abs(this.value);
    let i = 0;
    while (value >= 1000 && i < units.length - 1) {
      value /= 1000;
      i++;
    }
    const sign = this.value < 0 ? -1 : 1;
    const unit = units[i];
    if (!unit) return "";
    const formatter = new Intl.NumberFormat(this.locale ?? undefined, {
      style: "unit",
      unit,
      unitDisplay: this.display,
      maximumFractionDigits: i === 0 ? 0 : 1
    });
    return formatter.format(sign * value);
  }

  /**
   * Binary (IEC) base: 1024-based. `Intl.NumberFormat` has no kibibyte/
   * mebibyte units, so the number is formatted plainly (locale-aware) and an
   * honest IEC suffix (KiB, MiB, Kibit, ...) is appended by hand.
   */
  private formatBinary(): string {
    const isBit = this.unit === "bit";
    // [short, long, narrow] suffix per magnitude (index 0 = base unit).
    const table: ReadonlyArray<readonly [string, string, string]> = isBit
      ? [
          ["bit", "bits", "bit"],
          ["Kibit", "kibibits", "Kibit"],
          ["Mibit", "mebibits", "Mibit"],
          ["Gibit", "gibibits", "Gibit"],
          ["Tibit", "tebibits", "Tibit"]
        ]
      : [
          ["B", "bytes", "B"],
          ["KiB", "kibibytes", "KiB"],
          ["MiB", "mebibytes", "MiB"],
          ["GiB", "gibibytes", "GiB"],
          ["TiB", "tebibytes", "TiB"]
        ];
    let value = Math.abs(this.value);
    let i = 0;
    while (value >= 1024 && i < table.length - 1) {
      value /= 1024;
      i++;
    }
    const sign = this.value < 0 ? -1 : 1;
    const row = table[i];
    if (!row) return "";
    const suffix = this.display === "long" ? row[1] : this.display === "narrow" ? row[2] : row[0];
    const formatter = new Intl.NumberFormat(this.locale ?? undefined, {
      maximumFractionDigits: i === 0 ? 0 : 1
    });
    const num = formatter.format(sign * value);
    // Narrow display omits the space, matching Intl's "narrow" unit style.
    return this.display === "narrow" ? `${num}${suffix}` : `${num} ${suffix}`;
  }
}
