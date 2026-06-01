import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidFormAssociated } from "@fluid-ds/components/internal/form-associated";
import { reducedMotion } from "@fluid-ds/components/internal/motion";
import "@fluid-ds/components/define/calendar";
import "@fluid-ds/components/define/spinner";
import "../time-slots/define.js";
import {
  dayState,
  fromISODate,
  toISODate,
  fromLocalISO,
  type Availability,
  type Booking,
  type Slot
} from "../../internal/availability.js";

type TimeFormat = "12h" | "24h";

/** First / last `YYYY-MM-DD` of the month containing `iso`. */
function monthBounds(iso: string): { first: string; last: string; days: string[] } {
  const base = fromISODate(iso) ?? new Date();
  const y = base.getFullYear();
  const m = base.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => toISODate(new Date(y, m, i + 1)));
  return { first: days[0]!, last: days[days.length - 1]!, days };
}

/**
 * An accessible appointment picker: a fluid-calendar (with per-day availability
 * dots) beside a fluid-time-slots panel. The visitor picks a day, then a slot;
 * the chosen slot is the form value (ISO `YYYY-MM-DDTHH:MM`).
 *
 * Availability is a plain config object (recurring weekly hours + date
 * exceptions + slot rules). Bookings are subtracted from it. As the visitor
 * navigates months, `fluid-range-change` fires so you can lazily fetch only the
 * visible month's bookings and feed them back via the `bookings` property;
 * `refresh()` re-generates after any external change.
 *
 * @summary Book an appointment from available time slots.
 *
 * @csspart base - The grid container.
 * @csspart calendar - The inner fluid-calendar.
 * @csspart panel - The slot panel column.
 * @csspart slots - The inner fluid-time-slots.
 * @csspart prompt - The "choose a day" placeholder.
 *
 * @cssproperty --fluid-scheduler-gap - Gap between calendar and slots. Falls back to 1.25rem.
 * @cssproperty --fluid-scheduler-bg - Background. Falls back to transparent.
 * @cssproperty --fluid-scheduler-panel-min - Min width of the slot panel. Falls back to 14rem.
 * @cssproperty --fluid-scheduler-stack-below - Container width to stack at. Falls back to 560px.
 *
 * @uses-token --fluid-text-secondary - Placeholder + overlay text.
 * @uses-token --fluid-surface-base - Loading overlay backdrop.
 * @uses-token --fluid-accent-base - Availability dots / selection (via children).
 *
 * @fires fluid-range-change - The visible month changed. `detail: { start, end }` (first/last day, `YYYY-MM-DD`).
 * @fires fluid-day-select - A day was chosen. `detail: { date }`.
 * @fires fluid-change - A slot was committed. `detail: { value, start, end }`.
 */
export class FluidScheduler extends FluidFormAssociated {
  static override formAssociated = true;

  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        container-type: inline-size;
        font-family: var(--fluid-font-family-sans);
        background: var(--fluid-scheduler-bg, transparent);
      }
      :host([disabled]) {
        opacity: 0.6;
        pointer-events: none;
      }
      .base {
        display: grid;
        grid-template-columns: auto minmax(var(--fluid-scheduler-panel-min, 14rem), 1fr);
        gap: var(--fluid-scheduler-gap, 1.25rem);
        align-items: start;
      }
      @container (max-width: 560px) {
        .base {
          grid-template-columns: 1fr;
        }
      }
      .panel {
        position: relative;
        min-height: 8rem;
      }
      .prompt {
        margin: 0;
        padding: 2rem 0.5rem;
        text-align: center;
        color: var(--fluid-text-secondary);
        font-size: var(--fluid-font-size-sm, 0.875rem);
      }
      .overlay {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--fluid-surface-base, #fff) 65%, transparent);
        border-radius: var(--fluid-radius-md, 0.5rem);
      }
    `
  ];

  /** Availability configuration (object or JSON attribute). */
  @property({ type: Object }) availability: Availability | null = null;

  /** Known bookings to subtract from availability. */
  @property({ type: Array }) bookings: Booking[] = [];

  /** Selected slot start, ISO `YYYY-MM-DDTHH:MM` (the form value). */
  @property() override value: string | null = null;

  /** Field name for form submission. */
  @property() override name = "";

  /** Earliest selectable day, `YYYY-MM-DD`. Defaults to today. */
  @property() min: string | null = null;

  /** Latest selectable day, `YYYY-MM-DD`. Defaults to today + `maxAdvanceDays`. */
  @property() max: string | null = null;

  /** First weekday: 0 = Sunday … 6 = Saturday (default Monday). */
  @property({ type: Number, attribute: "week-start" }) weekStart = 1;

  /** BCP-47 locale for labels. */
  @property() locale: string | undefined = undefined;

  /** Clock format for slot labels. */
  @property({ attribute: "time-format" }) timeFormat: TimeFormat = "24h";

  /** Size passed through to the slot panel. */
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  /** Show a loading overlay on the slot panel (e.g. while fetching bookings). */
  @property({ type: Boolean }) loading = false;

  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readonly = false;

  /** The day whose slots are shown, `YYYY-MM-DD`. */
  @state() private selectedDate: string | null = null;

  /** The calendar's displayed month (any `YYYY-MM-DD` within it). */
  @state() private viewISO: string;

  private defaultValue: string | null = null;
  private lastRange = "";

  constructor() {
    super();
    this.viewISO = toISODate(new Date());
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.defaultValue = this.value;
    if (this.value) {
      this.selectedDate = this.value.slice(0, 10);
      this.viewISO = this.selectedDate;
      this.syncFormValue();
    }
    // Let the host fetch the initial month's bookings.
    this.updateComplete.then(() => this.emitRangeChange());
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.syncFormValue();
      if (this.value) this.selectedDate = this.value.slice(0, 10);
      if (this.required && !this.value) this.setValidity({ valueMissing: true }, "Please choose an appointment.");
      else this.setValidity({});
    }
  }

  override formResetCallback(): void {
    this.value = this.defaultValue;
    this.selectedDate = this.value ? this.value.slice(0, 10) : null;
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  /** Re-generate slots + day states (call after availability/bookings change out of band). */
  refresh(): void {
    this.requestUpdate();
  }

  /** Resolved earliest day: explicit `min`, else today. */
  private get minISO(): string {
    return this.min ?? toISODate(new Date());
  }

  /** Resolved latest day: explicit `max`, else today + maxAdvanceDays (if set). */
  private get maxISO(): string | null {
    if (this.max) return this.max;
    const adv = this.availability?.maxAdvanceDays;
    if (adv == null) return null;
    const d = new Date();
    return toISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + adv));
  }

  /** Per-day availability states for the visible month (drives the calendar dots). */
  private get dayStateMap(): Record<string, string> {
    if (!this.availability) return {};
    const now = new Date();
    const map: Record<string, string> = {};
    for (const iso of monthBounds(this.viewISO).days) {
      map[iso] = dayState(iso, this.availability, this.bookings, now);
    }
    return map;
  }

  private emitRangeChange(): void {
    const { first, last } = monthBounds(this.viewISO);
    const key = `${first}|${last}`;
    if (key === this.lastRange) return;
    this.lastRange = key;
    this.dispatchEvent(
      new CustomEvent("fluid-range-change", { detail: { start: first, end: last }, bubbles: true, composed: true })
    );
  }

  private onViewChange = (e: Event): void => {
    const view = (e as CustomEvent).detail?.view as string;
    if (view) {
      this.viewISO = view;
      this.emitRangeChange();
    }
  };

  private onDateActivate = (e: Event): void => {
    const iso = (e as CustomEvent).detail?.iso as string;
    if (!iso) return;
    this.selectedDate = iso;
    this.viewISO = iso;
    this.dispatchEvent(new CustomEvent("fluid-day-select", { detail: { date: iso }, bubbles: true, composed: true }));
  };

  private onSlotChange = (e: Event): void => {
    e.stopPropagation();
    const slot = (e as CustomEvent).detail?.slot as Slot | undefined;
    if (!slot) return;
    this.value = slot.start;
    const end = fromLocalISO(slot.end);
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: slot.start, start: slot.start, end: slot.end, timestamp: fromLocalISO(slot.start)?.getTime() ?? null, endTimestamp: end?.getTime() ?? null },
        bubbles: true,
        composed: true
      })
    );
  };

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <fluid-calendar
          part="calendar"
          .value=${this.selectedDate}
          view=${this.viewISO}
          min=${this.minISO}
          max=${this.maxISO ?? ""}
          week-start=${this.weekStart}
          locale=${this.locale ?? ""}
          .dayState=${this.dayStateMap}
          @fluid-date-activate=${this.onDateActivate}
          @fluid-view-change=${this.onViewChange}
        ></fluid-calendar>

        <div part="panel" class="panel">
          ${this.selectedDate
            ? html`
                <fluid-time-slots
                  part="slots"
                  date=${this.selectedDate}
                  .availability=${this.availability}
                  .bookings=${this.bookings}
                  .value=${this.value}
                  time-format=${this.timeFormat}
                  size=${this.size}
                  locale=${this.locale ?? ""}
                  ?disabled=${this.disabled || this.readonly}
                  @fluid-change=${this.onSlotChange}
                ></fluid-time-slots>
              `
            : html`<p part="prompt" class="prompt">Select a day to see available times.</p>`}
          ${this.loading
            ? html`<div class="overlay"><fluid-spinner label="Loading availability"></fluid-spinner></div>`
            : ""}
        </div>
      </div>
    `;
  }
}
