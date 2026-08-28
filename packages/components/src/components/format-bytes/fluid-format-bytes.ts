import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import { formattingLocales } from "../../internal/formatting-locale.js";
import type { FluidBinaryUnit } from "../../internal/localization.js";

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

  /** BCP 47 locale. Omit to inherit declared lang, then fall back to English. */
  @property() locale: string | null = null;

  /** Display style, binary (KiB, MiB) or decimal (KB, MB). */
  @property() base: "binary" | "decimal" = "decimal";

  override render(): TemplateResult {
    return html`${this.base === "binary" ? this.formatBinary() : this.formatDecimal()}`;
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
    const formatter = new Intl.NumberFormat(formattingLocales(this, this.locale), {
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
    const table: ReadonlyArray<readonly [string, FluidBinaryUnit, string]> = isBit
      ? [
          ["bit", "bit", "bit"],
          ["Kibit", "kibibit", "Kibit"],
          ["Mibit", "mebibit", "Mibit"],
          ["Gibit", "gibibit", "Gibit"],
          ["Tibit", "tebibit", "Tibit"]
        ]
      : [
          ["B", "byte", "B"],
          ["KiB", "kibibyte", "KiB"],
          ["MiB", "mebibyte", "MiB"],
          ["GiB", "gibibyte", "GiB"],
          ["TiB", "tebibyte", "TiB"]
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
    const locales = formattingLocales(this, this.locale);
    const maximumFractionDigits = i === 0 ? 0 : 1;
    const formatter = new Intl.NumberFormat(locales, { maximumFractionDigits });
    const signedValue = sign * value;
    const num = formatter.format(signedValue);
    if (this.display === "long") {
      const pluralCategory = new Intl.PluralRules(locales, { maximumFractionDigits }).select(
        signedValue
      );
      return this.localize.termForLocale(
        locales[0] ?? "en",
        "binaryUnit",
        pluralCategory,
        num,
        row[1]
      );
    }
    const suffix = this.display === "narrow" ? row[2] : row[0];
    // Narrow display omits the space, matching Intl's "narrow" unit style.
    return this.display === "narrow" ? `${num}${suffix}` : `${num} ${suffix}`;
  }
}
