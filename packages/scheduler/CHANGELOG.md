# @fluid-ds/scheduler

## 0.0.6

### Patch Changes

- Updated dependencies [81660d1]
- Updated dependencies [68ed464]
- Updated dependencies [2ff7a1e]
- Updated dependencies [b799cb8]
- Updated dependencies [9836631]
  - @fluid-ds/components@0.1.3

## 0.0.5

### Patch Changes

- Updated dependencies [b134248]
  - @fluid-ds/components@0.1.2

## 0.0.4

### Patch Changes

- Updated dependencies
  - @fluid-ds/icons@0.0.3
  - @fluid-ds/components@0.1.1

## 0.0.3

### Patch Changes

- db0556c: Add the **`@fluid-ds/scheduler`** expansion pack: an accessible appointment
  scheduler.
  - **`fluid-scheduler`**: a form-associated visitor picker pairing a
    `fluid-calendar` (with per-day availability dots) with a `fluid-time-slots`
    panel. Fires `fluid-range-change` so consumers can lazily fetch only the
    visible month's bookings, plus a `refresh()` method for live updates.
  - **`fluid-time-slots`**: a single day's bookable slots as a WAI-ARIA radio
    group (roving tabindex, arrow-key navigation, disabled full/past slots).
  - **`fluid-availability-editor`**: the owner-side weekly-hours + closed-dates
    editor that emits a complete availability config.
  - A pure, framework-free **availability engine** (`generateSlots`, `dayState`,
    full slot model: capacity, buffers, min-notice, max-advance) exported from the
    package root, usable server-side with no DOM.

  Also adds an additive, backward-compatible `dayState` feature to
  **`fluid-calendar`**: an optional `{ iso: state }` map that renders coloured
  availability dots and disables closed / unavailable days. `@fluid-ds/components`
  now exposes its `internal/*` base classes (`FluidElement`,
  `FluidFormAssociated`, motion helpers) as a subpath export so expansion packs
  can build on them.

- Updated dependencies [db0556c]
- Updated dependencies [db0556c]
- Updated dependencies [db0556c]
- Updated dependencies [db0556c]
- Updated dependencies [db0556c]
  - @fluid-ds/components@0.1.0
