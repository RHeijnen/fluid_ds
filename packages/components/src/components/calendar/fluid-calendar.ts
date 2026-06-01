import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import {
  type CalendarDay,
  type Weekday,
  fromISODate,
  toISODate,
  startOfDay,
  isSameDay,
  compareDay,
  addDays,
  addMonths,
  inRange,
  clampDate,
  getMonthGrid,
  weekdayNames,
  formatDate
} from "../../internal/date-utils.js";

/**
 * An accessible single-month calendar grid: the engine behind fluid-date-picker
 * and fluid-date-range-picker, and usable on its own.
 *
 * Implements the WAI-ARIA APG **Date Picker (grid)** pattern: a `role="grid"`
 * with column headers and `gridcell` day buttons, **roving tabindex** (one day
 * is tabbable, arrow keys move focus), and the full keyboard contract:
 * Arrow keys ±1 day / ±1 week, Home/End to week ends, PageUp/PageDown ±1 month,
 * Shift+PageUp/PageDown ±1 year, Enter/Space to select, and a live-region
 * announcement of the focused day.
 *
 * @summary A month grid for choosing a date (or painting a range).
 *
 * @csspart base - The calendar container.
 * @csspart header - The month label + nav row.
 * @csspart nav-button - The previous / next month buttons.
 * @csspart grid - The role=grid table.
 * @csspart day - Every day button.
 * @csspart day-selected - The selected day button(s).
 * @csspart day-today - Today's day button.
 *
 * @cssproperty --fluid-calendar-bg - Surface behind the calendar. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-calendar-fg - Day text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-calendar-muted-fg - Outside-month + weekday header color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-calendar-radius - Day cell corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-calendar-hover-bg - Day hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-calendar-selected-bg - Selected day fill. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-calendar-selected-fg - Selected day text. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-calendar-range-bg - In-range day fill. Falls back to a 15% accent tint.
 * @cssproperty --fluid-calendar-today-ring - Today's outline color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-calendar-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-calendar-dot-open - Availability dot for fully-open days. Falls back to --fluid-success-base.
 * @cssproperty --fluid-calendar-dot-some - Availability dot for partly-open days. Falls back to --fluid-warning-base.
 * @cssproperty --fluid-calendar-dot-full - Availability dot for fully-booked days. Falls back to --fluid-danger-base.
 *
 * @uses-token --fluid-surface-base - Calendar background.
 * @uses-token --fluid-surface-muted - Day hover background.
 * @uses-token --fluid-text-primary - Day text.
 * @uses-token --fluid-text-secondary - Outside-month / weekday text.
 * @uses-token --fluid-accent-base - Selected fill + today ring + focus ring.
 * @uses-token --fluid-accent-text - Selected text.
 * @uses-token --fluid-radius-md - Day corner radius.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum tap target (24px AA / 44px AAA).
 *
 * @fires fluid-date-activate - A day was chosen. `detail: { iso, date }`.
 * @fires fluid-date-hover - The pointer entered a day (range preview). `detail: { iso, date }`.
 * @fires fluid-view-change - The displayed month changed via the nav. `detail: { view }`.
 */
export class FluidCalendar extends FluidElement {
  static override styles = css`
    :host {
      display: inline-block;
      background: var(--fluid-calendar-bg, var(--fluid-surface-base));
      color: var(--fluid-calendar-fg, var(--fluid-text-primary));
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-sm, 0.875rem);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .month-label {
      font-weight: 600;
      font-size: var(--fluid-font-size-md, 1rem);
    }
    .nav-button {
      display: inline-grid;
      place-items: center;
      min-width: max(1.75rem, var(--fluid-target-min, 0px));
      min-height: max(1.75rem, var(--fluid-target-min, 0px));
      padding: 0;
      border: 0;
      border-radius: var(--fluid-calendar-radius, var(--fluid-radius-md));
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .nav-button:hover:not(:disabled) {
      background: var(--fluid-calendar-hover-bg, var(--fluid-surface-muted));
    }
    .nav-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th {
      padding: 0.25rem 0;
      font-weight: 500;
      font-size: 0.75rem;
      color: var(--fluid-calendar-muted-fg, var(--fluid-text-secondary));
    }
    td {
      padding: 1px;
      text-align: center;
    }
    .day {
      position: relative;
      display: inline-grid;
      place-items: center;
      width: 100%;
      min-width: max(2rem, var(--fluid-target-min, 0px));
      min-height: max(2rem, var(--fluid-target-min, 0px));
      box-sizing: border-box;
      padding: 0;
      border: 0;
      border-radius: var(--fluid-calendar-radius, var(--fluid-radius-md));
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .day:hover:not(:disabled):not(.selected) {
      background: var(--fluid-calendar-hover-bg, var(--fluid-surface-muted));
    }
    .day.outside {
      /* Adjacent-month days are real, focusable buttons (clicking one moves to
         that month), so their text must meet AA contrast. De-emphasize with the
         muted color alone; an additional opacity would blend the text toward the
         surface and drop it below 4.5:1 (e.g. #3f3f46 @ 0.55 → #959599, 2.98:1). */
      color: var(--fluid-calendar-muted-fg, var(--fluid-text-secondary));
    }
    .day.today {
      box-shadow: inset 0 0 0 1px var(--fluid-calendar-today-ring, var(--fluid-accent-base));
    }
    /* In-range fill sits on the cell so the band reads continuous; selected
       endpoints paint on top. Square inner edges so the band looks connected. */
    td.in-range {
      background: var(--fluid-calendar-range-bg, color-mix(in srgb, var(--fluid-accent-base) 16%, transparent));
    }
    td.range-start { border-top-left-radius: var(--fluid-radius-md); border-bottom-left-radius: var(--fluid-radius-md); }
    td.range-end { border-top-right-radius: var(--fluid-radius-md); border-bottom-right-radius: var(--fluid-radius-md); }
    .day.selected {
      background: var(--fluid-calendar-selected-bg, var(--fluid-accent-base));
      color: var(--fluid-calendar-selected-fg, var(--fluid-accent-text));
      font-weight: 600;
    }
    .day:disabled {
      color: var(--fluid-calendar-muted-fg, var(--fluid-text-secondary));
      opacity: 0.4;
      cursor: not-allowed;
    }
    .day:focus-visible {
      outline: var(--fluid-calendar-focus-ring-width, var(--fluid-focus-ring-width, 2px)) solid
        var(--fluid-accent-base);
      outline-offset: var(--fluid-focus-ring-offset, 1px);
    }
    /* Optional per-day availability dot (driven by the dayState map). Purely
       decorative (aria-hidden); the host conveys the same state in text. */
    .dot {
      position: absolute;
      bottom: 0.18rem;
      left: 50%;
      transform: translateX(-50%);
      width: 0.3rem;
      height: 0.3rem;
      border-radius: 50%;
      background: var(--fluid-accent-base);
    }
    .dot[data-state="open"] { background: var(--fluid-calendar-dot-open, var(--fluid-success-base)); }
    .dot[data-state="some"] { background: var(--fluid-calendar-dot-some, var(--fluid-warning-base)); }
    .dot[data-state="full"] { background: var(--fluid-calendar-dot-full, var(--fluid-danger-base)); }
    .day.selected .dot { background: var(--fluid-calendar-selected-fg, var(--fluid-accent-text)); }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  /** Selected date (single mode), `YYYY-MM-DD`. */
  @property() value: string | null = null;

  /** Paint a range instead of a single selection. */
  @property({ type: Boolean }) range = false;

  /** Range start to paint, `YYYY-MM-DD` (range mode). */
  @property({ attribute: "range-start" }) rangeStart: string | null = null;

  /** Range end to paint, `YYYY-MM-DD` (range mode). */
  @property({ attribute: "range-end" }) rangeEnd: string | null = null;

  /** Live hover endpoint for the range preview, `YYYY-MM-DD`. */
  @property({ attribute: "range-preview" }) rangePreview: string | null = null;

  /** The displayed month as any `YYYY-MM-DD` in that month. Controlled if set. */
  @property() view: string | null = null;

  /** Earliest selectable date, `YYYY-MM-DD`. */
  @property() min: string | null = null;

  /** Latest selectable date, `YYYY-MM-DD`. */
  @property() max: string | null = null;

  /** First day of the week: 0 = Sunday … 6 = Saturday. Default Monday (1). */
  @property({ type: Number, attribute: "week-start" }) weekStart: Weekday = 1;

  /** BCP-47 locale for month + weekday names. Defaults to the document locale. */
  @property() locale: string | undefined = undefined;

  /** Hide the month label + prev/next nav (the host drives the view instead). */
  @property({ type: Boolean, attribute: "no-nav" }) noNav = false;

  /**
   * Optional per-day state map, `{ "YYYY-MM-DD": "open" | "some" | "full" |
   * "closed" | "unavailable" }`. Days with `open` / `some` / `full` get a
   * coloured availability dot; `closed` / `unavailable` days are disabled.
   * Used by fluid-scheduler; harmless (no-op) when unset.
   */
  @property({ attribute: "day-state", type: Object }) dayState: Record<string, string> | null = null;

  /** The roving-focus date (one day is tabbable at a time). */
  @state() private focusISO: string | null = null;

  @query(".day[tabindex='0']") private focusBtn?: HTMLButtonElement;

  private get minDate(): Date | null {
    return fromISODate(this.min);
  }
  private get maxDate(): Date | null {
    return fromISODate(this.max);
  }

  /** The first-of-month Date currently shown. */
  private viewDate(): Date {
    const fromView = fromISODate(this.view);
    if (fromView) return new Date(fromView.getFullYear(), fromView.getMonth(), 1);
    const anchor = fromISODate(this.value) ?? fromISODate(this.rangeStart) ?? new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.focusISO) this.focusISO = this.initialFocusISO();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // Keep the roving focus inside the shown month when the view/value changes.
    if (changed.has("view") || changed.has("value")) {
      this.focusISO = this.initialFocusISO();
    }
  }

  /** Where the keyboard focus should land when the month (re)renders. */
  private initialFocusISO(): string {
    const v = this.viewDate();
    const candidates = [fromISODate(this.value), fromISODate(this.rangeStart), new Date()];
    for (const c of candidates) {
      if (c && c.getFullYear() === v.getFullYear() && c.getMonth() === v.getMonth()) {
        return toISODate(clampDate(c, this.minDate, this.maxDate));
      }
    }
    // Otherwise the first selectable day of the shown month.
    const first = clampDate(v, this.minDate, this.maxDate);
    return toISODate(first.getMonth() === v.getMonth() ? first : v);
  }

  private isDisabled(d: Date): boolean {
    if (!inRange(d, this.minDate, this.maxDate)) return true;
    const state = this.dayState?.[toISODate(d)];
    return state === "closed" || state === "unavailable";
  }

  private setView(d: Date, focus: Date): void {
    this.view = toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
    this.focusISO = toISODate(focus);
    this.dispatchEvent(
      new CustomEvent("fluid-view-change", { detail: { view: this.view }, bubbles: true, composed: true })
    );
  }

  private goMonth(delta: number): void {
    const v = addMonths(this.viewDate(), delta);
    this.setView(v, v);
    this.updateComplete.then(() => this.focusBtn?.focus());
  }

  private activate(d: Date): void {
    if (this.isDisabled(d)) return;
    this.dispatchEvent(
      new CustomEvent("fluid-date-activate", {
        detail: { iso: toISODate(d), date: d },
        bubbles: true,
        composed: true
      })
    );
  }

  private onDayKeydown = (e: KeyboardEvent): void => {
    const focus = fromISODate(this.focusISO) ?? startOfDay(new Date());
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(focus, -1); break;
      case "ArrowRight": next = addDays(focus, 1); break;
      case "ArrowUp": next = addDays(focus, -7); break;
      case "ArrowDown": next = addDays(focus, 7); break;
      case "Home": next = addDays(focus, -((focus.getDay() - this.weekStart + 7) % 7)); break;
      case "End": next = addDays(focus, 6 - ((focus.getDay() - this.weekStart + 7) % 7)); break;
      case "PageUp": next = addMonths(focus, e.shiftKey ? -12 : -1); next.setDate(Math.min(focus.getDate(), 28)); break;
      case "PageDown": next = addMonths(focus, e.shiftKey ? 12 : 1); next.setDate(Math.min(focus.getDate(), 28)); break;
      case "Enter":
      case " ":
        e.preventDefault();
        this.activate(focus);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (!next) return;
    // Move the shown month if focus left it.
    const v = this.viewDate();
    if (next.getMonth() !== v.getMonth() || next.getFullYear() !== v.getFullYear()) {
      this.setView(next, next);
    } else {
      this.focusISO = toISODate(next);
    }
    this.updateComplete.then(() => this.focusBtn?.focus());
  };

  private dayClass(day: CalendarDay): { td: string; btn: string } {
    const d = day.date;
    const selSingle = !this.range && isSameDay(d, fromISODate(this.value));
    const rs = fromISODate(this.rangeStart);
    let re = fromISODate(this.rangeEnd);
    const preview = fromISODate(this.rangePreview);
    // While only the start is set, paint toward the hovered day.
    if (this.range && rs && !re && preview) re = preview;
    let lo = rs;
    let hi = re;
    if (lo && hi && compareDay(lo, hi) > 0) [lo, hi] = [hi, lo];

    const isStart = this.range && isSameDay(d, rs);
    const isEnd = this.range && isSameDay(d, re);
    const isSelected = selSingle || isStart || isEnd;
    const between = this.range && lo && hi && compareDay(d, lo) > 0 && compareDay(d, hi) < 0;

    const td: string[] = [];
    if (this.range && (between || isStart || isEnd) && lo && hi && !isSameDay(lo, hi)) td.push("in-range");
    if (isStart) td.push("range-start");
    if (isEnd) td.push("range-end");

    const btn: string[] = ["day"];
    if (!day.inMonth) btn.push("outside");
    if (day.isToday) btn.push("today");
    if (isSelected) btn.push("selected");
    return { td: td.join(" "), btn: btn.join(" ") };
  }

  override render(): TemplateResult {
    const v = this.viewDate();
    const grid = getMonthGrid(v.getFullYear(), v.getMonth(), this.weekStart);
    const names = weekdayNames(this.locale, this.weekStart);
    const monthLabel = formatDate(v, this.locale, { month: "long", year: "numeric" });
    const rows: CalendarDay[][] = [];
    for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7));

    const prevDisabled = !!this.minDate && compareDay(addMonths(v, -1), startOfDay(this.minDate)) < 0 &&
      addMonths(v, -1).getMonth() !== startOfDay(this.minDate).getMonth();
    const nextDisabled = !!this.maxDate && compareDay(new Date(v.getFullYear(), v.getMonth() + 1, 1), startOfDay(this.maxDate)) > 0;

    return html`
      <div part="base" class="base">
        ${this.noNav
          ? html`<div class="header" part="header"><span class="month-label">${monthLabel}</span></div>`
          : html`
              <div class="header" part="header">
                <button part="nav-button" class="nav-button" type="button" aria-label="Previous month"
                  ?disabled=${prevDisabled} @click=${() => this.goMonth(-1)}>‹</button>
                <span class="month-label" aria-live="polite">${monthLabel}</span>
                <button part="nav-button" class="nav-button" type="button" aria-label="Next month"
                  ?disabled=${nextDisabled} @click=${() => this.goMonth(1)}>›</button>
              </div>`}

        <table part="grid" role="grid" aria-label=${monthLabel} @keydown=${this.onDayKeydown}>
          <thead>
            <tr role="row">
              ${names.map(
                (n, i) => html`<th role="columnheader" abbr=${weekdayNames(this.locale, this.weekStart)[i] ?? n}>${n}</th>`
              )}
            </tr>
          </thead>
          <tbody>
            ${rows.map(
              (week) => html`
                <tr role="row">
                  ${week.map((day) => {
                    const cls = this.dayClass(day);
                    const disabled = this.isDisabled(day.date);
                    const isFocus = day.iso === this.focusISO;
                    const label = formatDate(day.date, this.locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                    return html`
                      <td role="gridcell" class=${cls.td} aria-selected=${cls.btn.includes("selected") ? "true" : "false"}>
                        <button
                          part=${cls.btn.includes("selected") ? "day day-selected" : day.isToday ? "day day-today" : "day"}
                          class=${cls.btn}
                          type="button"
                          tabindex=${isFocus ? 0 : -1}
                          ?disabled=${disabled}
                          aria-label=${label}
                          aria-current=${day.isToday ? "date" : "false"}
                          @click=${() => this.activate(day.date)}
                          @pointerenter=${() =>
                            this.range &&
                            !disabled &&
                            this.dispatchEvent(
                              new CustomEvent("fluid-date-hover", {
                                detail: { iso: day.iso, date: day.date },
                                bubbles: true,
                                composed: true
                              })
                            )}
                        >${day.date.getDate()}${day.inMonth && this.dayState && ["open", "some", "full"].includes(this.dayState[day.iso] ?? "")
                          ? html`<span class="dot" data-state=${this.dayState[day.iso]} aria-hidden="true"></span>`
                          : ""}</button>
                      </td>`;
                  })}
                </tr>`
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}
