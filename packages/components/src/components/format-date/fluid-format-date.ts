import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

type DateStyle = "full" | "long" | "medium" | "short";
type TimeStyle = "full" | "long" | "medium" | "short";

/**
 * Format a date with Intl.DateTimeFormat. Accepts a JavaScript Date,
 * an ISO 8601 string, or a numeric timestamp as the `date` attribute.
 *
 * @summary Localized date formatter.
 */
export class FluidFormatDate extends FluidElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

  /** Date to format, Date, ISO string, or numeric ms. */
  @property() date: Date | string | number = new Date();

  /** Date style. */
  @property({ attribute: "date-style" }) dateStyle: DateStyle | undefined;

  /** Time style. */
  @property({ attribute: "time-style" }) timeStyle: TimeStyle | undefined;

  /** Locale. */
  @property() locale: string | null = null;

  /** Hour cycle. */
  @property({ attribute: "hour-cycle" }) hourCycle: "h11" | "h12" | "h23" | "h24" | undefined;

  /** IANA time zone (e.g. "America/Los_Angeles"). */
  @property({ attribute: "time-zone" }) timeZone: string | undefined;

  /** Detailed formatting options (overrides dateStyle/timeStyle if set). */
  @property() weekday: "narrow" | "short" | "long" | undefined;
  @property() era: "narrow" | "short" | "long" | undefined;
  @property() year: "numeric" | "2-digit" | undefined;
  @property() month: "numeric" | "2-digit" | "narrow" | "short" | "long" | undefined;
  @property() day: "numeric" | "2-digit" | undefined;
  @property() hour: "numeric" | "2-digit" | undefined;
  @property() minute: "numeric" | "2-digit" | undefined;
  @property() second: "numeric" | "2-digit" | undefined;
  @property({ attribute: "time-zone-name" }) timeZoneName:
    | "short"
    | "long"
    | "shortOffset"
    | "longOffset"
    | "shortGeneric"
    | "longGeneric"
    | undefined;

  override render(): TemplateResult {
    const date =
      this.date instanceof Date
        ? this.date
        : new Date(typeof this.date === "number" ? this.date : String(this.date));
    if (isNaN(date.getTime())) return html``;
    const opts: Intl.DateTimeFormatOptions = {};
    if (this.dateStyle) opts.dateStyle = this.dateStyle;
    if (this.timeStyle) opts.timeStyle = this.timeStyle;
    if (this.weekday) opts.weekday = this.weekday;
    if (this.era) opts.era = this.era;
    if (this.year) opts.year = this.year;
    if (this.month) opts.month = this.month;
    if (this.day) opts.day = this.day;
    if (this.hour) opts.hour = this.hour;
    if (this.minute) opts.minute = this.minute;
    if (this.second) opts.second = this.second;
    if (this.timeZoneName) opts.timeZoneName = this.timeZoneName;
    if (this.hourCycle) opts.hourCycle = this.hourCycle;
    if (this.timeZone) opts.timeZone = this.timeZone;
    try {
      return html`${new Intl.DateTimeFormat(this.locale ?? undefined, opts).format(date)}`;
    } catch {
      return html`${date.toISOString()}`;
    }
  }
}
