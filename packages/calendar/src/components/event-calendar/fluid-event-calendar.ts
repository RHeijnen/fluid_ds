import { LitElement, html, css, type TemplateResult, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";

/** A single calendar event. */
export interface CalendarEvent {
  /** Stable identifier, echoed back in fluid-event-click. */
  id: string;
  /** Day the event falls on, as YYYY-MM-DD (local). */
  date: string;
  /** Visible label rendered in the chip. */
  title: string;
  /** Semantic, theme-independent status tone. Defaults to "accent". */
  tone?: "accent" | "success" | "warning" | "danger";
}

type Tone = NonNullable<CalendarEvent["tone"]>;

interface DayCell {
  /** YYYY-MM-DD (local) for this cell. */
  iso: string;
  /** Day-of-month number. */
  day: number;
  /** False for leading / trailing days that belong to an adjacent month. */
  inMonth: boolean;
  /** True if this cell is today (local). */
  isToday: boolean;
  /** Events that fall on this day. */
  events: CalendarEvent[];
}

const pad = (n: number): string => String(n).padStart(2, "0");
const toISO = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Parse a YYYY-MM value into [year, monthIndex]; falls back to the current month. */
function parseMonth(value: string | undefined): [number, number] {
  const now = new Date();
  if (value) {
    const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]) - 1;
      if (month >= 0 && month <= 11) return [year, month];
    }
  }
  return [now.getFullYear(), now.getMonth()];
}

/**
 * A month view that DISPLAYS events. This is the read-oriented calendar (a
 * distinct concern from the booking scheduler): it lays out a six-week month
 * grid, drops event chips onto the days they fall on, and collapses any
 * overflow into a "+N more" indicator. Navigation steps the visible month and
 * day / event clicks surface as events for the host to act on.
 *
 * The grid is a `role="grid"` with one `role="row"` per week and a
 * `role="gridcell"` per day. Days use roving tabindex: exactly one day is in
 * the tab order at a time and arrow keys move between days (Home / End to the
 * ends of a week, PageUp / PageDown by month). Event tone is carried by the
 * theme-independent `--fluid-<tone>-*` tracks and is never color-only: the chip
 * always renders its title text.
 *
 * @summary Accessible month grid that displays events.
 *
 * @csspart base - The calendar root.
 * @csspart header - The header row (month label + navigation).
 * @csspart title - The month / year label.
 * @csspart nav - The navigation button group.
 * @csspart prev - The previous-month button.
 * @csspart next - The next-month button.
 * @csspart grid - The month grid.
 * @csspart weekday - A weekday column heading.
 * @csspart day - A day cell.
 * @csspart day-number - The day-of-month number inside a cell.
 * @csspart event - An event chip.
 * @csspart more - The "+N more" overflow indicator.
 *
 * @cssproperty --fluid-event-calendar-bg - Calendar background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-event-calendar-fg - Calendar text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-event-calendar-muted-fg - Muted text (trailing days, weekday heads). Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-event-calendar-border - Grid line / border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-event-calendar-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-event-calendar-today-bg - Today cell background tint. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-event-calendar-today-ring - Today day-number ring color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-event-calendar-nav-fg - Navigation button color. Falls back to --fluid-text-primary.
 *
 * @uses-token --fluid-surface-base - Calendar background.
 * @uses-token --fluid-surface-muted - Today cell tint.
 * @uses-token --fluid-text-primary - Primary text.
 * @uses-token --fluid-text-secondary - Muted text.
 * @uses-token --fluid-border-default - Grid lines.
 * @uses-token --fluid-radius-md - Corner radius.
 * @uses-token --fluid-accent-base - Accent track (default tone, today ring).
 * @uses-token --fluid-accent-text - Accent foreground.
 * @uses-token --fluid-success-base - Success tone track.
 * @uses-token --fluid-success-text - Success tone foreground.
 * @uses-token --fluid-warning-base - Warning tone track.
 * @uses-token --fluid-warning-text - Warning tone foreground.
 * @uses-token --fluid-danger-base - Danger tone track.
 * @uses-token --fluid-danger-text - Danger tone foreground.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum control target (24px AA / 44px AAA).
 *
 * @fires fluid-month-change - The visible month changed. detail: { month: "YYYY-MM" }.
 * @fires fluid-day-click - A day cell was activated. detail: { date: "YYYY-MM-DD" }.
 * @fires fluid-event-click - An event chip was activated. detail: { id, event }.
 */
export class FluidEventCalendar extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans, system-ui, sans-serif);
      color: var(--fluid-event-calendar-fg, var(--fluid-text-primary, #18181b));
    }
    .base {
      background: var(--fluid-event-calendar-bg, var(--fluid-surface-base, #ffffff));
      border: 1px solid var(--fluid-event-calendar-border, var(--fluid-border-default, #e4e4e7));
      border-radius: var(--fluid-event-calendar-radius, var(--fluid-radius-md, 0.5rem));
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
    }
    .title {
      margin: 0;
      font-size: var(--fluid-font-size-lg, 1.125rem);
      font-weight: 600;
      line-height: 1.2;
    }
    .nav {
      display: inline-flex;
      gap: 0.25rem;
    }
    .nav-btn {
      display: inline-grid;
      place-items: center;
      min-width: max(2rem, var(--fluid-target-min, 0px));
      min-height: max(2rem, var(--fluid-target-min, 0px));
      padding: 0;
      border: 1px solid var(--fluid-event-calendar-border, var(--fluid-border-default, #e4e4e7));
      border-radius: var(--fluid-radius-sm, 0.375rem);
      background: transparent;
      color: var(--fluid-event-calendar-nav-fg, var(--fluid-text-primary, #18181b));
      cursor: pointer;
    }
    .nav-btn:hover {
      background: var(--fluid-event-calendar-today-bg, var(--fluid-surface-muted, #f4f4f5));
    }
    .nav-btn:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-event-calendar-today-ring, var(--fluid-accent-base, #4f46e5));
      outline-offset: 2px;
    }
    .nav-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
    .weekday {
      padding: 0.5rem 0.25rem;
      text-align: center;
      font-size: var(--fluid-font-size-sm, 0.875rem);
      font-weight: 600;
      color: var(--fluid-event-calendar-muted-fg, var(--fluid-text-secondary, #3f3f46));
      border-top: 1px solid var(--fluid-event-calendar-border, var(--fluid-border-default, #e4e4e7));
    }
    .week {
      display: contents;
    }
    .day {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-height: 5.5rem;
      padding: 0.3rem;
      border-top: 1px solid var(--fluid-event-calendar-border, var(--fluid-border-default, #e4e4e7));
      border-left: 1px solid var(--fluid-event-calendar-border, var(--fluid-border-default, #e4e4e7));
      text-align: left;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .day:nth-child(7n + 1) {
      border-left: 0;
    }
    .day:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-event-calendar-today-ring, var(--fluid-accent-base, #4f46e5));
      outline-offset: -2px;
    }
    .day.is-out {
      color: var(--fluid-event-calendar-muted-fg, var(--fluid-text-secondary, #3f3f46));
    }
    .day.is-today {
      background: var(--fluid-event-calendar-today-bg, var(--fluid-surface-muted, #f4f4f5));
    }
    .day-number {
      align-self: flex-start;
      min-width: 1.5rem;
      min-height: 1.5rem;
      display: inline-grid;
      place-items: center;
      font-size: var(--fluid-font-size-sm, 0.875rem);
      font-variant-numeric: tabular-nums;
      border-radius: var(--fluid-radius-full, 999px);
    }
    .day.is-today .day-number {
      box-shadow: inset 0 0 0 2px var(--fluid-event-calendar-today-ring, var(--fluid-accent-base, #4f46e5));
      font-weight: 700;
    }
    .events {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .event {
      display: block;
      width: 100%;
      text-align: left;
      padding: 0.1rem 0.4rem;
      border: 0;
      border-radius: var(--fluid-radius-sm, 0.375rem);
      font: inherit;
      font-size: var(--fluid-font-size-xs, 0.75rem);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      min-height: max(1.25rem, var(--fluid-target-min, 0px));
      background: var(--tone-bg);
      color: var(--tone-fg);
    }
    .event:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--tone-bg);
      outline-offset: 2px;
    }
    .event.tone-accent {
      --tone-bg: var(--fluid-accent-base, #4f46e5);
      --tone-fg: var(--fluid-accent-text, #ffffff);
    }
    .event.tone-success {
      --tone-bg: var(--fluid-success-base, #16a34a);
      --tone-fg: var(--fluid-success-text, #ffffff);
    }
    .event.tone-warning {
      --tone-bg: var(--fluid-warning-base, #b45309);
      --tone-fg: var(--fluid-warning-text, #ffffff);
    }
    .event.tone-danger {
      --tone-bg: var(--fluid-danger-base, #dc2626);
      --tone-fg: var(--fluid-danger-text, #ffffff);
    }
    .more {
      align-self: flex-start;
      padding: 0.05rem 0.3rem;
      border: 0;
      background: transparent;
      font: inherit;
      font-size: var(--fluid-font-size-xs, 0.75rem);
      color: var(--fluid-event-calendar-muted-fg, var(--fluid-text-secondary, #3f3f46));
      cursor: pointer;
      text-decoration: underline;
    }
    .more:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-event-calendar-today-ring, var(--fluid-accent-base, #4f46e5));
      outline-offset: 1px;
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
        animation: none !important;
      }
    }
  `;

  /** The visible month as YYYY-MM. Defaults to the current month. */
  @property({ type: String }) month = "";

  /** Events to display. Accepts an array property or a JSON string attribute. */
  @property({ type: Array }) events: CalendarEvent[] = [];

  /** First day of the week: 0 (Sunday) through 6 (Saturday). Default 1 (Monday). */
  @property({ type: Number, attribute: "week-start" }) weekStart = 1;

  /** BCP-47 locale for month and weekday names. Defaults to the document locale. */
  @property({ type: String }) locale = "";

  /** Maximum event chips shown per day before collapsing into "+N more". */
  @property({ type: Number, attribute: "max-per-day" }) maxPerDay = 3;

  /** ISO of the day currently in the roving tab order. */
  @state() private focusedISO = "";

  private get monthParts(): [number, number] {
    return parseMonth(this.month);
  }

  private get weekStartDay(): number {
    const w = Math.trunc(this.weekStart);
    return w >= 0 && w <= 6 ? w : 1;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if ((changed.has("month") || changed.has("weekStart")) && this.focusedISO) {
      // If the focused day is no longer in the visible grid, drop it so the
      // roving target re-seeds to the first day of the new month.
      const cells = this.buildCells();
      if (!cells.some((c) => c.iso === this.focusedISO)) this.focusedISO = "";
    }
  }

  private buildCells(): DayCell[] {
    const [year, month] = this.monthParts;
    const first = new Date(year, month, 1);
    const lead = (first.getDay() - this.weekStartDay + 7) % 7;
    const today = toISO(new Date());

    const byDay = new Map<string, CalendarEvent[]>();
    for (const ev of this.events ?? []) {
      if (!ev || typeof ev.date !== "string") continue;
      const list = byDay.get(ev.date);
      if (list) list.push(ev);
      else byDay.set(ev.date, [ev]);
    }

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(year, month, 1 - lead + i);
      const iso = toISO(d);
      cells.push({
        iso,
        day: d.getDate(),
        inMonth: d.getMonth() === month,
        isToday: iso === today,
        events: byDay.get(iso) ?? []
      });
    }
    return cells;
  }

  private weekdayNames(): string[] {
    const fmt = new Intl.DateTimeFormat(this.locale || undefined, { weekday: "short" });
    // 2024-01-07 is a Sunday; rotate to the configured first day.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 7 + ((this.weekStartDay + i) % 7)))
    );
  }

  private monthLabel(): string {
    const [year, month] = this.monthParts;
    return new Intl.DateTimeFormat(this.locale || undefined, { month: "long", year: "numeric" }).format(
      new Date(year, month, 1)
    );
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private changeMonth(delta: number): void {
    const [year, month] = this.monthParts;
    const next = new Date(year, month + delta, 1);
    const value = `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;
    this.month = value;
    this.focusedISO = "";
    this.emit("fluid-month-change", { month: value });
  }

  private onDayClick(cell: DayCell): void {
    this.emit("fluid-day-click", { date: cell.iso });
  }

  private onEventClick(ev: CalendarEvent, originalEvent: Event): void {
    originalEvent.stopPropagation();
    this.emit("fluid-event-click", { id: ev.id, event: ev });
  }

  private focusISO(iso: string): void {
    this.focusedISO = iso;
    this.updateComplete.then(() => {
      const el = this.renderRoot.querySelector<HTMLElement>(`[data-iso="${iso}"]`);
      el?.focus();
    });
  }

  private onGridKeydown(e: KeyboardEvent, cells: DayCell[], current: DayCell): void {
    const idx = cells.findIndex((c) => c.iso === current.iso);
    if (idx < 0) return;
    let target = idx;
    switch (e.key) {
      case "ArrowRight":
        target = idx + 1;
        break;
      case "ArrowLeft":
        target = idx - 1;
        break;
      case "ArrowDown":
        target = idx + 7;
        break;
      case "ArrowUp":
        target = idx - 7;
        break;
      case "Home":
        target = idx - (idx % 7);
        break;
      case "End":
        target = idx - (idx % 7) + 6;
        break;
      case "PageUp":
        e.preventDefault();
        this.changeMonth(-1);
        return;
      case "PageDown":
        e.preventDefault();
        this.changeMonth(1);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        this.onDayClick(current);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (target < 0 || target >= cells.length) return;
    const next = cells[target];
    if (next) this.focusISO(next.iso);
  }

  override render(): TemplateResult {
    const cells = this.buildCells();
    const max = Math.max(0, Math.trunc(this.maxPerDay));

    // Seed the roving target: the focused day if still present, else today if
    // visible and in-month, else the first in-month day.
    let activeISO = this.focusedISO && cells.some((c) => c.iso === this.focusedISO) ? this.focusedISO : "";
    if (!activeISO) {
      const today = cells.find((c) => c.isToday && c.inMonth);
      const firstIn = cells.find((c) => c.inMonth);
      activeISO = today?.iso ?? firstIn?.iso ?? cells[0]?.iso ?? "";
    }

    const weekdays = this.weekdayNames();
    const rows: DayCell[][] = [];
    for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
    const label = this.monthLabel();

    return html`
      <div part="base" class="base">
        <div part="header" class="header">
          <h2 part="title" class="title" id="ec-title">${label}</h2>
          <div part="nav" class="nav">
            <button
              part="prev"
              class="nav-btn"
              type="button"
              aria-label="Previous month"
              @click=${() => this.changeMonth(-1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
            </button>
            <button
              part="next"
              class="nav-btn"
              type="button"
              aria-label="Next month"
              @click=${() => this.changeMonth(1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
            </button>
          </div>
        </div>

        <div part="grid" class="grid" role="grid" aria-labelledby="ec-title">
          <div class="week" role="row">
            ${weekdays.map(
              (name) => html`<span part="weekday" class="weekday" role="columnheader">${name}</span>`
            )}
          </div>
          ${rows.map(
            (week) => html`
              <div class="week" role="row">
                ${week.map((cell) => this.renderDay(cell, cells, activeISO, max))}
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  private renderDay(
    cell: DayCell,
    cells: DayCell[],
    activeISO: string,
    max: number
  ): TemplateResult {
    const visible = max > 0 ? cell.events.slice(0, max) : cell.events;
    const overflow = cell.events.length - visible.length;
    const isActive = cell.iso === activeISO;

    const dateLabel = new Intl.DateTimeFormat(this.locale || undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(`${cell.iso}T00:00:00`));
    const count = cell.events.length;
    const ariaLabel = count > 0 ? `${dateLabel}, ${count} event${count === 1 ? "" : "s"}` : dateLabel;

    return html`
      <div
        part="day"
        class="day ${cell.inMonth ? "" : "is-out"} ${cell.isToday ? "is-today" : ""}"
        role="gridcell"
        data-iso=${cell.iso}
        tabindex=${isActive ? 0 : -1}
        aria-label=${ariaLabel}
        aria-current=${cell.isToday ? "date" : "false"}
        @click=${() => this.onDayClick(cell)}
        @keydown=${(e: KeyboardEvent) => this.onGridKeydown(e, cells, cell)}
      >
        <span part="day-number" class="day-number">${cell.day}</span>
        ${visible.length
          ? html`<div class="events">
              ${visible.map((ev) => {
                const tone: Tone = ev.tone ?? "accent";
                return html`<button
                  part="event"
                  class="event tone-${tone}"
                  type="button"
                  title=${ev.title}
                  @click=${(e: Event) => this.onEventClick(ev, e)}
                >
                  ${ev.title}
                </button>`;
              })}
            </div>`
          : ""}
        ${overflow > 0
          ? html`<button
              part="more"
              class="more"
              type="button"
              aria-label=${`Show all ${count} events on ${dateLabel}`}
              @click=${(e: Event) => {
                e.stopPropagation();
                this.onDayClick(cell);
              }}
            >
              +${overflow} more
            </button>`
          : ""}
      </div>
    `;
  }
}
