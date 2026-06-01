/**
 * Framework-free availability + slot engine for the Fluid scheduler.
 *
 * Pure functions, no DOM, no date library: just `Date`. Everything is
 * **date-only / wall-clock local**, the same discipline as the components
 * package's `date-utils.ts`: we never serialize to UTC, so a slot a visitor
 * sees at 09:00 is always 09:00 regardless of time zone. The `timeZone` field on
 * `Availability` is reserved for a later release; v1 renders in the viewer's
 * local zone.
 *
 * The job: turn a business's recurring weekly hours (plus date-specific
 * exceptions) and a list of existing bookings into the concrete, bookable time
 * slots for a given day, marking each one available / full / past / blocked.
 */

/** `"HH:MM"` 24-hour wall-clock time, e.g. `"09:30"`. */
export type Time = string;

/** A contiguous open window within a single day. */
export interface TimeWindow {
  /** Inclusive start, `"HH:MM"`. */
  start: Time;
  /** Exclusive end, `"HH:MM"`. */
  end: Time;
}

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A date-specific override of the weekly rule (holiday or special hours). */
export interface AvailabilityException {
  /** `YYYY-MM-DD` the override applies to. */
  date: string;
  /** Closed all day (overrides any windows). */
  closed?: boolean;
  /** Replacement open windows for this date (ignored when `closed`). */
  windows?: TimeWindow[];
}

/** The full availability configuration a business defines. */
export interface Availability {
  /** Recurring weekly open windows, keyed by weekday (0 = Sunday). */
  weekly: Partial<Record<Weekday, TimeWindow[]>>;
  /** Date-specific overrides. */
  exceptions?: AvailabilityException[];
  /** Appointment length in minutes (e.g. 30). */
  slotMinutes: number;
  /** Minutes between slot starts; defaults to `slotMinutes` (back-to-back). */
  stepMinutes?: number;
  /** Padding reserved after each booking, in minutes. Defaults to 0. */
  bufferMinutes?: number;
  /** Bookings allowed per slot. Defaults to 1; > 1 enables group slots. */
  capacity?: number;
  /** Cannot book sooner than now + this many minutes. Defaults to 0. */
  minNoticeMinutes?: number;
  /** Cannot book further out than this many days. Defaults to unlimited. */
  maxAdvanceDays?: number;
  /** Reserved for full IANA support; v1 renders local. */
  timeZone?: string;
}

/** An existing appointment, fed in to subtract from availability. */
export interface Booking {
  /** ISO datetime, `YYYY-MM-DDTHH:MM`. */
  start: string;
  /** Optional ISO end; defaults to `start` + `slotMinutes`. */
  end?: string;
}

export type SlotState = "available" | "full" | "past" | "blocked";

/** A single bookable slot for a day. */
export interface Slot {
  /** ISO datetime `YYYY-MM-DDTHH:MM` (local wall-clock). */
  start: string;
  /** ISO datetime `YYYY-MM-DDTHH:MM`. */
  end: string;
  /** `capacity` minus overlapping bookings (never below 0). */
  remaining: number;
  /** Bookability: open, fully booked, in the past / within notice, or out of horizon. */
  state: SlotState;
}

/** Coarse per-day state for a calendar availability dot. */
export type DayState = "open" | "some" | "full" | "closed" | "unavailable";

const pad = (n: number): string => String(n).padStart(2, "0");

/** `"HH:MM"` → minutes since local midnight, or `null` if malformed. */
export function parseTime(time: Time): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Minutes since midnight → `"HH:MM"` (wraps defensively at 24h). */
export function minutesToTime(total: number): Time {
  const m = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** Local `Date` → `YYYY-MM-DD`. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → local-midnight `Date`, or `null` if malformed. */
export function fromISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) {
    return null;
  }
  return d;
}

/** Build a local `Date` from a `YYYY-MM-DD` and minutes since midnight. */
function dateAtMinutes(iso: string, minutes: number): Date | null {
  const base = fromISODate(iso);
  if (!base) return null;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(minutes / 60), minutes % 60);
}

/** Local `Date` → `YYYY-MM-DDTHH:MM` (no zone, wall-clock). */
export function toLocalISO(date: Date): string {
  return `${toISODate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse `YYYY-MM-DDTHH:MM` (or a date-only string) to a local `Date`. */
export function fromLocalISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(iso.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0));
}

/**
 * The open windows that apply to a date: an exception (closed → none, or its
 * own windows) takes precedence over the recurring weekly rule.
 */
export function windowsForDate(iso: string, availability: Availability): TimeWindow[] {
  const exception = availability.exceptions?.find((e) => e.date === iso);
  if (exception) {
    if (exception.closed) return [];
    return exception.windows ?? [];
  }
  const date = fromISODate(iso);
  if (!date) return [];
  return availability.weekly[date.getDay() as Weekday] ?? [];
}

/** Does a booking (extended by buffer) overlap the half-open slot interval? */
function bookingOverlaps(slotStart: Date, slotEnd: Date, booking: Booking, slotMinutes: number, buffer: number): boolean {
  const bStart = fromLocalISO(booking.start);
  if (!bStart) return false;
  const bEndRaw = booking.end ? fromLocalISO(booking.end) : null;
  const bEnd = bEndRaw ?? new Date(bStart.getTime() + slotMinutes * 60_000);
  const bEndBuffered = new Date(bEnd.getTime() + buffer * 60_000);
  return bStart.getTime() < slotEnd.getTime() && bEndBuffered.getTime() > slotStart.getTime();
}

/**
 * Generate every slot for one day, marking each available / full / past /
 * blocked. `now` is injected for testability (the component passes `new Date()`).
 */
export function generateSlots(iso: string, availability: Availability, bookings: Booking[] = [], now: Date = new Date()): Slot[] {
  const { slotMinutes } = availability;
  const step = availability.stepMinutes && availability.stepMinutes > 0 ? availability.stepMinutes : slotMinutes;
  const buffer = availability.bufferMinutes ?? 0;
  const capacity = availability.capacity && availability.capacity > 0 ? availability.capacity : 1;
  const noticeCutoff = now.getTime() + (availability.minNoticeMinutes ?? 0) * 60_000;
  const horizon =
    availability.maxAdvanceDays != null
      ? now.getTime() + availability.maxAdvanceDays * 24 * 60 * 60_000
      : Infinity;

  const slots: Slot[] = [];
  for (const window of windowsForDate(iso, availability)) {
    const winStart = parseTime(window.start);
    const winEnd = parseTime(window.end);
    if (winStart == null || winEnd == null || winEnd <= winStart) continue;
    for (let m = winStart; m + slotMinutes <= winEnd; m += step) {
      const start = dateAtMinutes(iso, m);
      const end = dateAtMinutes(iso, m + slotMinutes);
      if (!start || !end) continue;
      const booked = bookings.filter((b) => bookingOverlaps(start, end, b, slotMinutes, buffer)).length;
      const remaining = Math.max(0, capacity - booked);

      let state: SlotState;
      if (start.getTime() < noticeCutoff) state = "past";
      else if (start.getTime() > horizon) state = "blocked";
      else if (remaining <= 0) state = "full";
      else state = "available";

      slots.push({ start: toLocalISO(start), end: toLocalISO(end), remaining, state });
    }
  }
  // Windows can be authored out of order; keep slots chronological.
  slots.sort((a, b) => a.start.localeCompare(b.start));
  return slots;
}

/**
 * Coarse day classification for a calendar dot:
 * - `closed`: the business is not open that day.
 * - `open`: every generated slot is bookable.
 * - `some`: at least one slot is bookable, but not all.
 * - `full`: open, but every slot is fully booked.
 * - `unavailable`: open, but every slot is in the past / outside the booking horizon.
 */
export function dayState(iso: string, availability: Availability, bookings: Booking[] = [], now: Date = new Date()): DayState {
  if (windowsForDate(iso, availability).length === 0) return "closed";
  const slots = generateSlots(iso, availability, bookings, now);
  if (slots.length === 0) return "closed";
  const available = slots.filter((s) => s.state === "available").length;
  if (available === slots.length) return "open";
  if (available > 0) return "some";
  if (slots.some((s) => s.state === "full")) return "full";
  return "unavailable";
}
