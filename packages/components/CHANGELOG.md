# @fluid-ds/components

## 0.1.0

### Minor Changes

- db0556c: Add 26 more core components (75 → 101 families), each built to the full
  authoring standard (semantics + WCAG 2.2 AA, the component-token override
  ladder, stories, docs page, playground card, and tests):
  - Layout / shell: `fluid-hero`, `fluid-app-bar`, `fluid-sidebar`,
    `fluid-aspect-ratio`.
  - Navigation: `fluid-nav-list` (+ `fluid-nav-item`), `fluid-anchor-nav`,
    `fluid-context-menu`.
  - Forms: `fluid-form`, `fluid-fieldset`, `fluid-range-slider`,
    `fluid-time-picker`, `fluid-masked-input`, `fluid-transfer`,
    `fluid-dropzone`.
  - Feedback / flow: `fluid-result`, `fluid-loading-overlay`,
    `fluid-popconfirm`, `fluid-tour`, `fluid-meter`.
  - Content: `fluid-description-list` (+ `fluid-description-item`),
    `fluid-list` (+ `fluid-list-item`), `fluid-image`, `fluid-countdown`,
    `fluid-truncate`.
  - Utility: `fluid-theme-toggle`, and a non-visual `fluid-hotkey`
    (keyboard-shortcut) behavior.

- db0556c: Add 15 new core components (60 → 75), all to the authoring standard (WCAG 2.2
  AA, component-scoped tokens, story + docs page + playground card + tests):
  - **Navigation + commands**: `fluid-menu` (+ `fluid-menu-item` / `fluid-menu-label`,
    APG menu), `fluid-command-palette` (⌘K modal combobox), `fluid-pagination`,
    `fluid-toolbar` (roving tabindex), `fluid-speed-dial` (FAB menu button).
  - **Forms**: `fluid-field` (label + description + error wrapper), `fluid-otp`
    (PIN / one-time-code, form-associated), `fluid-tag-input` (token input,
    form-associated).
  - **Content + status**: `fluid-timeline` (+ `fluid-timeline-item`), `fluid-stat`
    (KPI), `fluid-avatar-group`, `fluid-banner`, `fluid-kbd`, `fluid-empty-state`,
    `fluid-pricing-table` (+ `fluid-pricing-tier`).

  Also widens the internal `FluidFormAssociated.value` type to allow a string
  array (so multi-value controls like the tag input can hold structured values and
  serialize to a string for form submission).

### Patch Changes

- db0556c: Add the date component family: `fluid-calendar`, `fluid-date-picker`, and
  `fluid-date-range-picker`.
  - **`fluid-calendar`**: an accessible month grid built on the WAI-ARIA APG
    date-picker dialog pattern (`role="grid"` with roving-tabindex keyboard
    navigation: arrows, Home/End, PageUp/PageDown, Shift+PageUp/Down). Supports
    single and range selection, min/max bounds, configurable week start, and
    locale-aware day and weekday names.
  - **`fluid-date-picker`**: a form-associated single-date field with a popover
    calendar (positioned with floating-ui), ISO `YYYY-MM-DD` values, and
    configurable display format and size.
  - **`fluid-date-range-picker`**: a form-associated range field with dual
    calendars, a configurable preset column (Today, Yesterday, Last 7/30 days,
    This/Last month, replaceable or disableable), and hover-preview range
    selection.

  All three follow the component-token override ladder
  (`--fluid-calendar-*`, `--fluid-date-picker-*`, `--fluid-date-range-picker-*`),
  honor `prefers-reduced-motion`, and ship stories, docs, a playground card, and
  tests.

  Also fixes an AA contrast regression in `fluid-calendar`: adjacent-month day
  buttons were dimmed with an extra `opacity`, which blended their text below the
  4.5:1 minimum. They now de-emphasize with the muted color alone.

- db0556c: Fix `fluid-date-picker` and `fluid-date-range-picker` popovers being clipped /
  invisible inside constrained containers (Storybook preview frames, transformed
  or `overflow`-hidden ancestors). Both panels now render in the **top layer** via
  the native Popover API (`popover="manual"` + `showPopover()` / `hidePopover()`,
  `:popover-open` + `@starting-style` for the fade), matching the approach already
  used by `fluid-dropdown`. floating-ui still drives placement; a plain
  `position: fixed` panel could be trapped by a transformed containing block.
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
