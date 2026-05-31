import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

type Unit = "year" | "quarter" | "month" | "week" | "day" | "hour" | "minute" | "second";

const UNITS: Array<{ unit: Unit; ms: number }> = [
  { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: "day", ms: 1000 * 60 * 60 * 24 },
  { unit: "hour", ms: 1000 * 60 * 60 },
  { unit: "minute", ms: 1000 * 60 },
  { unit: "second", ms: 1000 }
];

/**
 * Renders a date as a relative phrase ("3 hours ago", "in 2 days") using
 * `Intl.RelativeTimeFormat`. Auto-refreshes on a schedule that escalates
 * with the unit, every minute for "minutes ago", every hour for "hours
 * ago", etc.
 *
 * @summary Localized relative-time formatter.
 */
export class FluidRelativeTime extends FluidElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

  /** The date to compare against now. */
  @property() date: Date | string | number = new Date();

  /** Locale. */
  @property() locale: string | null = null;

  /** Numeric style, "auto" allows phrases like "yesterday". */
  @property() numeric: "always" | "auto" = "auto";

  /** Length style. */
  @property() format: "long" | "short" | "narrow" = "long";

  /** Disable auto-refresh. */
  @property({ type: Boolean, attribute: "no-sync" }) noSync = false;

  private timer: number | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.scheduleRefresh();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTimer();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("date") || changed.has("noSync")) this.scheduleRefresh();
  }

  private clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleRefresh() {
    this.clearTimer();
    if (this.noSync) return;
    // Refresh roughly once per minute. The unit choice will track the actual
    // age of the date.
    this.timer = window.setTimeout(() => {
      this.requestUpdate();
      this.scheduleRefresh();
    }, 60_000);
  }

  private toDate(): Date | null {
    const date =
      this.date instanceof Date
        ? this.date
        : new Date(typeof this.date === "number" ? this.date : String(this.date));
    if (isNaN(date.getTime())) return null;
    return date;
  }

  override render(): TemplateResult {
    const date = this.toDate();
    if (!date) return html``;
    const diff = date.getTime() - Date.now();
    const abs = Math.abs(diff);
    const matched = UNITS.find((u) => abs >= u.ms) ?? UNITS[UNITS.length - 1]!;
    const value = Math.round(diff / matched.ms);
    try {
      const formatter = new Intl.RelativeTimeFormat(this.locale ?? undefined, {
        numeric: this.numeric,
        style: this.format
      });
      return html`${formatter.format(value, matched.unit)}`;
    } catch {
      return html`${date.toISOString()}`;
    }
  }
}
