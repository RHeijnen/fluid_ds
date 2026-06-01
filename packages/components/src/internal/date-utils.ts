/**
 * Framework-free date helpers shared by fluid-calendar, fluid-date-picker, and
 * fluid-date-range-picker. No date library: just `Date` + `Intl`.
 *
 * Everything here is **date-only and local**. We deliberately avoid UTC so a
 * date a user picks on a calendar never shifts a day across time zones, the
 * canonical serialized form is an ISO `YYYY-MM-DD` string built from the local
 * Y/M/D, and parsing builds a local midnight `Date`.
 */

/** A single rendered calendar cell. */
export interface CalendarDay {
  /** Local midnight Date for this cell. */
  date: Date;
  /** `YYYY-MM-DD`. */
  iso: string;
  /** False for leading/trailing days that belong to the adjacent month. */
  inMonth: boolean;
  /** True if this cell is today (local). */
  isToday: boolean;
}

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const pad = (n: number): string => String(n).padStart(2, "0");

/** Local Y/M/D → `YYYY-MM-DD` (never shifts across time zones). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → local-midnight Date, or null if malformed/invalid. */
export function fromISODate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, month, day);
  // Reject overflow like 2026-02-31 (Date would roll it to March).
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return d;
}

export function isValidISODate(iso: string | null | undefined): boolean {
  return fromISODate(iso) !== null;
}

/** Strip the time component, returning a new local-midnight Date. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Whole-day comparison: <0 if a before b, 0 same day, >0 after. */
export function compareDay(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

/** True if `date`'s day is within [min, max] (either bound may be null/open). */
export function inRange(date: Date, min: Date | null, max: Date | null): boolean {
  if (min && compareDay(date, min) < 0) return false;
  if (max && compareDay(date, max) > 0) return false;
  return true;
}

/** Clamp a date to [min, max] at day granularity. */
export function clampDate(date: Date, min: Date | null, max: Date | null): Date {
  if (min && compareDay(date, min) < 0) return startOfDay(min);
  if (max && compareDay(date, max) > 0) return startOfDay(max);
  return startOfDay(date);
}

/**
 * The 42-cell (6×7) grid for a month, including leading/trailing days of the
 * adjacent months so every row is full. `weekStartsOn` defaults to Monday (1).
 */
export function getMonthGrid(year: number, month: number, weekStartsOn: Weekday = 1): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const lead = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const today = startOfDay(new Date());
  const cells: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - lead + i);
    cells.push({
      date: d,
      iso: toISODate(d),
      inMonth: d.getMonth() === month,
      isToday: isSameDay(d, today)
    });
  }
  return cells;
}

/** Localized weekday short names, ordered to start on `weekStartsOn`. */
export function weekdayNames(locale: string | undefined, weekStartsOn: Weekday = 1): string[] {
  const fmt = new Intl.DateTimeFormat(locale || undefined, { weekday: "short" });
  // 2024-01-07 is a Sunday; offset to the requested first day.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + ((weekStartsOn + i) % 7))));
}

/** Format a date for display in the input / header. */
export function formatDate(
  date: Date,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  return new Intl.DateTimeFormat(locale || undefined, options).format(date);
}

/* ------------------------------------------------------------------ */
/* Range presets                                                       */
/* ------------------------------------------------------------------ */

/** An inclusive day range. */
export interface DayRange {
  start: Date;
  end: Date;
}

/** A selectable shortcut in the range picker's preset column. */
export interface RangePreset {
  /** Stable identifier (used for the active-state check). */
  id: string;
  /** Visible label. */
  label: string;
  /** Returns the range relative to `now` (defaults to today). */
  getRange: (now?: Date) => DayRange;
}

/**
 * The built-in preset list (ported from the reference). Consumers can replace
 * or extend it via the picker's `presets` property, or disable presets
 * entirely. Each returns date-only bounds; the picker decides how to serialize.
 */
export const defaultRangePresets: RangePreset[] = [
  { id: "today", label: "Today", getRange: (now = new Date()) => ({ start: startOfDay(now), end: startOfDay(now) }) },
  {
    id: "yesterday",
    label: "Yesterday",
    getRange: (now = new Date()) => ({ start: addDays(startOfDay(now), -1), end: addDays(startOfDay(now), -1) })
  },
  {
    id: "last7",
    label: "Last 7 days",
    getRange: (now = new Date()) => ({ start: addDays(startOfDay(now), -6), end: startOfDay(now) })
  },
  {
    id: "last30",
    label: "Last 30 days",
    getRange: (now = new Date()) => ({ start: addDays(startOfDay(now), -29), end: startOfDay(now) })
  },
  {
    id: "thisMonth",
    label: "This month",
    getRange: (now = new Date()) => ({
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    })
  },
  {
    id: "lastMonth",
    label: "Last month",
    getRange: (now = new Date()) => ({
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0)
    })
  }
];

/** Match a concrete range back to a preset id (for the active highlight). */
export function matchPreset(range: DayRange, presets: RangePreset[], now = new Date()): string | null {
  for (const p of presets) {
    const r = p.getRange(now);
    if (isSameDay(r.start, range.start) && isSameDay(r.end, range.end)) return p.id;
  }
  return null;
}
