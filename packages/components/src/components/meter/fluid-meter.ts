import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Which qualitative band the current value falls into, following the native
 * `<meter>` algorithm. "optimum" is the good band, "suboptimum" is acceptable
 * (one step from optimum), and "even-less-good" is the worst band (two steps
 * away). We map these onto theme-independent status tones for the fill color.
 */
export type FluidMeterBand = "optimum" | "suboptimum" | "even-less-good";

/**
 * Graphical display of a scalar measurement within a known range: a gauge.
 *
 * Distinct from `<fluid-progress-bar>`: a meter shows a measured value (disk
 * usage, battery, score, relevance), not the completion of a task. It mirrors
 * the native `<meter>` element's semantics, including its `low` / `high` /
 * `optimum` band algorithm, and exposes `role="meter"` with the matching
 * `aria-valuemin` / `aria-valuemax` / `aria-valuenow` / `aria-valuetext`.
 *
 * The bar color reflects the band (optimum / suboptimum / worst) using the
 * theme-independent success / warning / danger status tokens. The band is also
 * conveyed in the accessible value text, so it is never communicated by color
 * alone (SC 1.4.1 Use of Color).
 *
 * Not interactive: a meter has no keyboard contract (APG Meter pattern).
 *
 * @summary Gauge for a measured value within a known range.
 *
 * @csspart base - The outer container.
 * @csspart track - The track (background groove).
 * @csspart fill - The filled portion whose color reflects the band.
 * @csspart label - The label row.
 * @csspart value - The value text.
 *
 * Every styled property reads a component-scoped `--fluid-meter-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-meter-track - Track background color. Falls back to --fluid-color-neutral-200.
 * @cssproperty --fluid-meter-fill - Fill color in the optimum band. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-meter-optimum-fill - Fill color when the value is in the optimum band. Falls back to --fluid-success-base.
 * @cssproperty --fluid-meter-low-fill - Fill color for the acceptable-but-not-optimum (suboptimum) band. Falls back to --fluid-warning-base.
 * @cssproperty --fluid-meter-high-fill - Fill color for the worst band. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-meter-radius - Track + fill corner radius. Falls back to --fluid-radius-full.
 * @cssproperty --fluid-meter-height - Track height. Falls back to 0.75rem.
 * @cssproperty --fluid-meter-font-family - Label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-meter-label-fg - Label text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-meter-value-fg - Value text color. Falls back to --fluid-text-secondary.
 *
 * @uses-token --fluid-color-neutral-200 - Default track color.
 * @uses-token --fluid-accent-base - Default fill color (no banding configured).
 * @uses-token --fluid-success-base - Optimum-band fill (theme-independent status tone).
 * @uses-token --fluid-warning-base - Suboptimum-band fill (theme-independent status tone).
 * @uses-token --fluid-danger-base - Worst-band fill (theme-independent status tone).
 * @uses-token --fluid-radius-full - Default track corner radius.
 * @uses-token --fluid-text-primary - Label text color.
 * @uses-token --fluid-text-secondary - Value text color.
 * @uses-token --fluid-font-family-sans - Label font family.
 * @uses-token --fluid-gradient-glossy - Fill sheen.
 */
export class FluidMeter extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      /* Pin typography so a prose context cannot inflate the label row. */
      font-family: var(--fluid-meter-font-family, var(--fluid-font-family-sans));
      line-height: 1.4;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
      width: 100%;
    }

    .label {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--fluid-space-3);
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-meter-label-fg, var(--fluid-text-primary));
    }

    ::slotted(*) {
      margin: 0 !important;
    }

    .value-text {
      font-variant-numeric: tabular-nums;
      color: var(--fluid-meter-value-fg, var(--fluid-text-secondary));
    }

    .track {
      position: relative;
      width: 100%;
      height: var(--fluid-meter-height, 0.75rem);
      background: var(--fluid-meter-track, var(--fluid-color-neutral-200));
      border-radius: var(--fluid-meter-radius, var(--fluid-radius-full));
      overflow: hidden;
      /*
       * The fill-vs-track boundary is a state-conveying graphic, so the track
       * carries an inset hairline to keep that boundary visible at 3:1 even on
       * a low-contrast page background (SC 1.4.11).
       */
      box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
    }

    .fill {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      background-color: var(--fluid-meter-fill, var(--fluid-accent-base));
      background-image: var(--fluid-gradient-glossy);
      border-radius: inherit;
      transition: width var(--fluid-duration-normal) var(--fluid-easing-standard);
    }

    .fill.band-optimum {
      background-color: var(--fluid-meter-optimum-fill, var(--fluid-success-base));
    }
    .fill.band-suboptimum {
      background-color: var(--fluid-meter-low-fill, var(--fluid-warning-base));
    }
    .fill.band-even-less-good {
      background-color: var(--fluid-meter-high-fill, var(--fluid-danger-base));
    }

    @media (prefers-reduced-motion: reduce) {
      .fill {
        transition-duration: 0.01ms;
      }
    }
  `;

  /** Measured value. Clamped into [min, max]. */
  @property({ type: Number }) value = 0;

  /** Lower bound of the range. */
  @property({ type: Number }) min = 0;

  /** Upper bound of the range. */
  @property({ type: Number }) max = 100;

  /**
   * Upper bound of the "low" end of the range. Values at or below `low` are
   * considered low. Mirrors the native `<meter low>` attribute.
   */
  @property({ type: Number }) low?: number;

  /**
   * Lower bound of the "high" end of the range. Values at or above `high` are
   * considered high. Mirrors the native `<meter high>` attribute.
   */
  @property({ type: Number }) high?: number;

  /**
   * The position considered optimal. Determines which of the low / medium /
   * high segments is "good". Mirrors the native `<meter optimum>` attribute.
   */
  @property({ type: Number }) optimum?: number;

  /** Accessible label for the gauge. Falls back to "Meter". */
  @property() label?: string;

  /** Show the value text at the end of the label row. */
  @property({ type: Boolean, attribute: "show-value" }) showValue = false;

  /**
   * Format function for the value text and the numeric part of
   * `aria-valuetext`. Receives the clamped value. Defaults to the raw number.
   */
  @property({ attribute: false }) valueFormatter?: (value: number) => string;

  @state() private band: FluidMeterBand = "optimum";

  /** Largest of min/max, used to keep a sane range even if they are swapped. */
  private get hi(): number {
    return Math.max(this.min, this.max);
  }

  private get lo(): number {
    return Math.min(this.min, this.max);
  }

  /** Value clamped into the actual range. */
  private get clamped(): number {
    const v = Number.isFinite(this.value) ? this.value : this.lo;
    return Math.min(this.hi, Math.max(this.lo, v));
  }

  /**
   * Reproduces the HTML `<meter>` gauge-region algorithm to decide whether the
   * current value sits in the optimum, suboptimum (one step away), or
   * even-less-good (two steps away) band. Returns "optimum" with no banding
   * when neither low/high nor optimum is configured.
   */
  private computeBand(): FluidMeterBand {
    const lo = this.lo;
    const hi = this.hi;
    // Clamp low/high into range and order them, per the spec.
    let low = this.low ?? lo;
    let high = this.high ?? hi;
    low = Math.min(hi, Math.max(lo, low));
    high = Math.min(hi, Math.max(lo, high));
    if (low > high) low = high;

    // No banding configured: there is a single "optimum" region.
    const hasBanding =
      this.low !== undefined || this.high !== undefined || this.optimum !== undefined;
    if (!hasBanding) return "optimum";

    const optimum = Math.min(hi, Math.max(lo, this.optimum ?? (lo + hi) / 2));
    const value = this.clamped;

    // Which of the three segments (low / medium / high) is the optimum region?
    let optimumRegion: "low" | "medium" | "high";
    if (optimum < low) optimumRegion = "low";
    else if (optimum > high) optimumRegion = "high";
    else optimumRegion = "medium";

    // Which segment does the value fall in?
    let valueRegion: "low" | "medium" | "high";
    if (value < low) valueRegion = "low";
    else if (value > high) valueRegion = "high";
    else valueRegion = "medium";

    if (valueRegion === optimumRegion) return "optimum";

    // Adjacent segments are "suboptimum"; the opposite end is the worst band.
    const order: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];
    const distance = Math.abs(order.indexOf(valueRegion) - order.indexOf(optimumRegion));
    return distance === 1 ? "suboptimum" : "even-less-good";
  }

  /** Human-readable band name used in the accessible value text. */
  private bandLabel(band: FluidMeterBand): string {
    switch (band) {
      case "optimum":
        return "good";
      case "suboptimum":
        return "fair";
      case "even-less-good":
        return "poor";
    }
  }

  private get hasBanding(): boolean {
    return this.low !== undefined || this.high !== undefined || this.optimum !== undefined;
  }

  /** Numeric portion of the value text (formatter or raw number). */
  private numericText(value: number): string {
    return this.valueFormatter ? this.valueFormatter(value) : String(value);
  }

  /**
   * Full accessible value text. Always pairs the number with its range, and,
   * when banding is configured, the qualitative band, so the status is never
   * conveyed by color alone.
   */
  private valueText(value: number): string {
    const base = `${this.numericText(value)} of ${this.numericText(this.hi)}`;
    return this.hasBanding ? `${base}, ${this.bandLabel(this.band)}` : base;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has("value") ||
      changed.has("min") ||
      changed.has("max") ||
      changed.has("low") ||
      changed.has("high") ||
      changed.has("optimum")
    ) {
      this.band = this.computeBand();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "meter");
  }

  protected override updated(): void {
    const value = this.clamped;
    this.setAttribute("aria-valuemin", String(this.lo));
    this.setAttribute("aria-valuemax", String(this.hi));
    this.setAttribute("aria-valuenow", String(value));
    this.setAttribute("aria-valuetext", this.valueText(value));
    if (!this.hasAttribute("aria-labelledby")) {
      this.setAttribute("aria-label", this.label ?? "Meter");
    }
  }

  private renderLabel(): TemplateResult | "" {
    const hasSlot = this.children.length > 0;
    if (!hasSlot && !this.showValue) return "";
    const value = this.clamped;
    return html`
      <div part="label" class="label">
        <slot></slot>
        ${this.showValue
          ? html`<span part="value" class="value-text">${this.valueText(value)}</span>`
          : ""}
      </div>
    `;
  }

  override render(): TemplateResult {
    const value = this.clamped;
    const span = this.hi - this.lo;
    const fraction = span > 0 ? (value - this.lo) / span : 0;
    const pct = Math.max(0, Math.min(100, fraction * 100));
    const bandClass = this.hasBanding ? `band-${this.band}` : "";
    return html`
      <div part="base" class="base">
        ${this.renderLabel()}
        <div part="track" class="track">
          <div
            part="fill"
            class="fill ${bandClass}"
            style="width: ${pct.toFixed(2)}%;"
          ></div>
        </div>
      </div>
    `;
  }
}
