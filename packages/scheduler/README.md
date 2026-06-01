# @fluid-ds/scheduler

Accessible appointment / availability scheduler for [Fluid](https://fluid-web.dev),
shipped as an opt-in expansion pack.

A business defines when it is open (recurring weekly hours plus date-specific
exceptions); a visitor sees a calendar with bookable time slots and picks one.
The selected slot is a real form value, so it drops into any intake or checkout
form. Built on standard web components: works in React, Vue, Angular, Svelte, or
plain HTML.

> Alpha. Install with the `alpha` tag: `npm i @fluid-ds/scheduler@alpha`.

## What's inside

- **`fluid-scheduler`** the visitor picker: a calendar (with per-day
  availability dots) beside a time-slot panel. Form-associated.
- **`fluid-time-slots`** the slot list for a single day, usable on its own.
- **`fluid-availability-editor`** the owner-side weekly-hours + exceptions
  editor that emits an availability config.
- A pure **availability engine** (`generateSlots`, `dayState`, types) exported
  from the package root, usable on its own (including server-side) with no DOM.

## Engine quick start

```ts
import { generateSlots, type Availability } from "@fluid-ds/scheduler";

const availability: Availability = {
  weekly: {
    1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    2: [{ start: "09:00", end: "17:00" }]
  },
  slotMinutes: 30,
  minNoticeMinutes: 120,
  maxAdvanceDays: 30
};

const slots = generateSlots("2026-06-15", availability, /* bookings */ []);
// → [{ start: "2026-06-15T09:00", end: "2026-06-15T09:30", remaining: 1, state: "available" }, …]
```

All dates are date-only / wall-clock local (never UTC), so a 09:00 slot is
always 09:00 regardless of time zone.

## License

MIT
