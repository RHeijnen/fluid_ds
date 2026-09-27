# @fluid-ds/scheduler

## 1.0.0-rc.0

### Minor Changes

- 4139c57: Add the Rainbow brand preset and the tokens it needs.
  - New `@fluid-ds/themes/rainbow.css`: playful pastels on cream paper, 3px ink
    outlines, squircle corners, solid offset "pop" shadows and a rounded display
    font, verified at AA and AAA in light and dark.
  - New tokens: `--fluid-border-width-default` and `--fluid-border-width-divider`
    (every literal 1px outline and divider in the catalog now reads them through a
    per-component knob such as `--fluid-card-border-width`),
    `--fluid-font-family-display`, `--fluid-easing-spring`, and the optional
    `--fluid-accent-fg` / `--fluid-<tone>-fg` roles for themes whose accent fill is
    too light to use as text.
  - New component knobs: button outline width, resting / pressed / toggled
    shadows and press depth; switch track and thumb size, outline and shadows;
    badge outline; card radius and header font; dialog outline and title font;
    input shadow. New `fluid-pop-in` keyframe.
  - New expansion pack `@fluid-ds/rainbow`: `<fluid-rainbow-landscape>`,
    `<fluid-rainbow-clock>` and `<fluid-rainbow-battery>` widgets plus fourteen
    illustrated app icons for the shared icon registry, with React wrappers.

  Every new token defaults to the previous value, so existing brands render
  unchanged.

### Patch Changes

- Updated dependencies [4139c57]
  - @fluid-ds/components@1.0.0-rc.0
  - @fluid-ds/icons@1.0.0-rc.0

## 0.4.0

### Minor Changes

- Localize scheduler, time-slot, and availability-editor interface copy and live status text,
  including locale-aware dates, numbers, and right-to-left direction.
- Strengthen form behavior across reset, state restoration, reconnect, disabled, readonly, and
  loading states. Focus now delegates to an available day or slot, and unavailable selections
  are revalidated before submission.
- Preserve special-date hours and advanced availability settings when editing, retain fractional
  notice periods, and keep invalid time ranges as marked drafts instead of emitting invalid
  availability.

## 0.0.9

### Patch Changes

- Updated dependencies
  - @fluid-ds/components@0.1.6

## 0.0.8

### Patch Changes

- Updated dependencies
  - @fluid-ds/components@0.1.5

## 0.0.7

### Patch Changes

- Updated dependencies
  - @fluid-ds/components@0.1.4

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
