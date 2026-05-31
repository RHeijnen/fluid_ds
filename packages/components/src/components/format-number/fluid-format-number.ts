import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Format numbers with Intl.NumberFormat. Supports decimal, percent,
 * currency, and unit display modes with full locale-aware formatting.
 *
 * @summary Localized number formatter.
 */
export class FluidFormatNumber extends FluidElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

  /** Value to format. */
  @property({ type: Number }) value = 0;

  /** Number style. */
  @property() type: "decimal" | "currency" | "percent" | "unit" = "decimal";

  /** BCP 47 locale, or omit for the browser default. */
  @property() locale: string | null = null;

  /** ISO 4217 currency code (e.g. "USD"). Required when type = currency. */
  @property() currency: string | null = null;

  /** Currency display. */
  @property({ attribute: "currency-display" }) currencyDisplay:
    | "symbol"
    | "narrowSymbol"
    | "code"
    | "name" = "symbol";

  /** Unit identifier (e.g. "kilogram"). Required when type = unit. */
  @property() unit: string | null = null;

  /** Unit display. */
  @property({ attribute: "unit-display" }) unitDisplay: "short" | "long" | "narrow" = "short";

  /** Use thousand separators. */
  @property({ type: Boolean, attribute: "no-grouping" }) noGrouping = false;

  /** Minimum integer digits. */
  @property({ type: Number, attribute: "minimum-integer-digits" }) minimumIntegerDigits = 1;

  /** Minimum fraction digits. */
  @property({ type: Number, attribute: "minimum-fraction-digits" })
  minimumFractionDigits: number | undefined;

  /** Maximum fraction digits. */
  @property({ type: Number, attribute: "maximum-fraction-digits" })
  maximumFractionDigits: number | undefined;

  override render(): TemplateResult {
    const options: Intl.NumberFormatOptions = {
      style: this.type,
      useGrouping: !this.noGrouping,
      minimumIntegerDigits: this.minimumIntegerDigits
    };
    if (this.minimumFractionDigits !== undefined)
      options.minimumFractionDigits = this.minimumFractionDigits;
    if (this.maximumFractionDigits !== undefined)
      options.maximumFractionDigits = this.maximumFractionDigits;
    if (this.type === "currency" && this.currency) {
      options.currency = this.currency;
      options.currencyDisplay = this.currencyDisplay;
    }
    if (this.type === "unit" && this.unit) {
      options.unit = this.unit;
      options.unitDisplay = this.unitDisplay;
    }
    try {
      const formatter = new Intl.NumberFormat(this.locale ?? undefined, options);
      return html`${formatter.format(this.value)}`;
    } catch {
      // Fall back to a plain number if options were inconsistent.
      return html`${String(this.value)}`;
    }
  }
}
