# Design + plan: appointment scheduler

Status: **proposed** (not built). Target: alpha 0.0.3 line.

## What we're building

An accessible **appointment / availability picker**: a business defines when it
is open (recurring weekly hours plus date-specific exceptions), and a visitor
sees a calendar with bookable time slots and picks one. Think the vet, the
dentist, the barber, the "book a demo" widget. The selected slot is a real form
value, so it drops into any checkout / intake form.

Two roles exist in this problem:

1. **Owner** defines availability (open hours, slot length, capacity, holidays).
2. **Visitor** browses available days and picks an open slot.

We build the visitor picker first (the high-value, reusable part). Owner setup
is initially just data you pass in; an interactive editor is a later phase.

## Package placement

**New opt-in extension package `@fluid-ds/scheduler`**, mirroring
`@fluid-ds/charts` / `markdown` / `qr` / `media`. Rationale: it is
domain-specific (booking), carries real date/availability logic, and most
consumers will not need it, so it stays out of the core bundle. It depends on
`@fluid-ds/components` (reuses `fluid-calendar`, `fluid-button`, `fluid-select`,
`fluid-spinner`) and `@fluid-ds/icons`.

## Components

| Element | Role |
| --- | --- |
| `fluid-scheduler` | Headline visitor picker: calendar + time-slot panel, form-associated. |
| `fluid-time-slots` | Standalone slot list for a single day (the right pane, usable on its own). |
| `fluid-availability-editor` | Owner-facing weekly-hours + exceptions editor that emits an `Availability` config (in scope this release). |

Plus an internal pure-logic module `src/internal/availability.ts`, the booking
analog of the components package's `date-utils.ts` (no DOM, fully unit-tested).

## Data model (the contract)

```ts
type Time = `${number}:${number}`;        // "09:00", 24h local wall-clock
interface TimeWindow { start: Time; end: Time; }

interface Availability {
  // Recurring weekly open windows, keyed by weekday 0..6 (0 = Sunday).
  weekly: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, TimeWindow[]>>;
  // Date-specific overrides: holidays (closed) or special hours.
  exceptions?: Array<{ date: string; closed?: boolean; windows?: TimeWindow[] }>;
  slotMinutes: number;        // appointment length, e.g. 30
  stepMinutes?: number;       // gap between slot starts (default = slotMinutes)
  bufferMinutes?: number;     // padding reserved after each appointment
  capacity?: number;          // bookings allowed per slot (default 1; >1 = group)
  minNoticeMinutes?: number;  // cannot book sooner than now + this
  maxAdvanceDays?: number;    // cannot book further out than this
  timeZone?: string;          // IANA tz; default = viewer's local zone
}

interface Booking { start: string; end?: string; }   // ISO datetime, already taken

interface Slot {
  start: string;              // ISO datetime
  end: string;
  remaining: number;          // capacity - booked
  state: "available" | "full" | "past" | "blocked";
}
```

## The engine (`availability.ts`, pure functions)

- `generateSlots(date, availability, bookings, now): Slot[]` resolves the day's
  windows (an exception overrides the weekly rule), slices them by
  `stepMinutes` / `slotMinutes`, then marks each slot `past` / `full` / `blocked`
  by subtracting `bookings` (respecting `capacity` + `bufferMinutes`) and the
  `minNotice` / `maxAdvance` bounds.
- `dayState(date, availability, bookings, now): "open" | "some" | "full" | "closed"`
  drives the calendar's per-day availability dot.
- Time helpers: parse `"HH:MM"`, build a tz-aware ISO datetime from a local
  date + wall-clock time (via `Intl`, no date library), window arithmetic.

All timezone-safe and local-first, the same discipline as `date-utils.ts`.

## `fluid-scheduler` API

Props:
- `availability` (object property, or JSON string attribute) the config above.
- `bookings` (array) known taken slots to subtract.
- `value` (ISO datetime) the selected slot; the form value (`override` + `name`).
- `min` / `max` (ISO dates) bound the calendar.
- `week-start`, `locale`, `time-format` (`12h` | `24h`), `size` (sm/md/lg).
- `loading` (boolean) overlays a spinner on the slot pane during async fetches.
- `name`, `required`, `disabled`, `readonly` (form-associated, extends
  `FluidFormAssociated`).

Events:
- `fluid-range-change {start, end}` fires when the visible month changes, so the
  consumer can **lazily fetch only that range's bookings** and feed them back.
  This is the "update with new data every time x happens" hook.
- `fluid-day-select {date}` a day was chosen.
- `fluid-change {value, start, end}` a slot was committed (the form value).

Methods:
- `refresh()` re-runs slot generation (poll on an interval, or after a
  websocket / SSE message says availability changed).

Layout: left = `fluid-calendar` with availability dots (fed a `dayState` map),
right = `fluid-time-slots` for the selected day. Side-by-side at >= 640px,
stacked below. The slot pane shows a spinner overlay while `loading`.

## Accessibility (WAI-ARIA APG, AA by default / AAA-ready)

- **Calendar**: the existing `fluid-calendar` grid pattern (already AA, keyboard
  complete).
- **Time slots = radiogroup**: `role="radiogroup"` labelled by the selected
  date; each slot is a `role="radio"` with `aria-checked`; roving tabindex,
  arrow keys move, Enter / Space selects. `full` / `past` slots are
  `aria-disabled`.
- A polite **live region** announces "N slots available on <date>" when the day
  changes.
- Slots read the conformance tokens (`--fluid-target-min`,
  `--fluid-focus-ring-*`) so they scale to 44x44 + thicker focus under
  `data-fluid-conformance="aaa"` with no per-component branching.
- Every (foreground, background) pair (available / selected / full / hover /
  focus ring) is verified to meet AA, across the three brands x light/dark.

## Theming

Component-token override ladder, no `:host` pinning:
`--fluid-scheduler-*` and `--fluid-time-slots-*` each fall back to the semantic
vars. Parts: `base`, `calendar`, `slots`, `slot`, `slot-selected`, `slot-full`.
Slots reuse the option / segmented-control accent language for visual
consistency. New tokens annotated `@cssproperty`, semantic deps `@uses-token`.

## Reactive data (the "every time x happens" requirement)

Two complementary mechanisms:
1. **Push**: assign `.bookings` / `.availability` and the component re-renders.
2. **Pull**: `fluid-range-change` fires on month nav so you fetch only the
   visible window; `refresh()` re-generates after any external change (interval
   poll, websocket, SSE).

## `fluid-time-slots` (standalone)

Props: `date`, plus either `slots` (pre-generated `Slot[]`) or
`availability` + `bookings` (self-generates via the engine); `value`,
`time-format`, `columns`. Event: `fluid-change`. Same radiogroup a11y. Useful on
its own for a "today's openings" widget.

## Phase plan

- **P0** `availability.ts` engine + unit tests (pure, fast, the risky logic).
- **P1** `fluid-time-slots` (radiogroup, theming, a11y, tests).
- **P2** `fluid-scheduler` (calendar + slots, lazy `range-change`,
  form-associated, `refresh()`).
- **P3** package scaffold `@fluid-ds/scheduler` (build config, `/define/*`
  entries, CEM ingestion), wire into playground / docs / coverage gate.
- **P4** `fluid-availability-editor`: owner-facing weekly-hours grid + exception
  list that emits an `Availability` config (two-way with `fluid-scheduler` in the
  demo). Tests + a11y.
- **P5** docs pages + stories + playground cards + a **vet-clinic demo** (owner
  editor wired to the visitor picker) + FEATURES + changeset, then `pnpm verify`
  + `pnpm docs:build` green + browser-verify.

Decisions locked (with the user): extension package; **both** the visitor picker
and the owner editor ship this release; full slot model (capacity, buffers,
min-notice, max-advance); local-first rendering with `timeZone` reserved in the
data model for later full IANA support.

## Reference demo

Vet clinic: open Mon-Fri 09:00-12:00 and 13:00-17:00, Sat 09:00-12:00, closed
Sun; 20-minute slots; a few pre-booked; minimum 2 hours notice; up to 30 days
ahead. Shows availability dots, slot picking, and a confirmation summary.
