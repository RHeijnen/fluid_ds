# @fluid-ds/components

## 0.1.5

### Patch Changes

- Place select and typeahead option lists by where the trigger is on screen
  rather than where it sits in the document. Naming `document.documentElement` as
  the overflow boundary measured against document coordinates while the trigger
  was measured against the viewport, so a scrolled page kept whatever placement
  it would have had at scroll zero: a control near the bottom of a long page
  opened upwards even once it had been scrolled to the top of the screen, over
  several hundred pixels of empty space. The boundary was there to stop a
  clipping ancestor forcing a flip, which the top layer already handles, so the
  viewport is now the only boundary.

## 0.1.4

### Patch Changes

- Add `keep-open` to the typeahead, for picking several values in one go. A
  combobox closes on select because choosing one value is the whole interaction;
  a picker that gathers a set is a different thing, and closing after every pick
  means reopening and retyping to add the next one. With `keep-open` the list
  stays put and the query is left alone, since the query is what found this row
  and will find the next one. Each pick is still reported through `fluid-change`,
  so what is selected remains the consumer's to hold, and Escape and Tab still
  dismiss the list.

## 0.1.3

### Patch Changes

- 81660d1: Forward form-control names to the native input, textarea, and typeahead controls and give internal search controls stable shadow-root identifiers so browser autofill and form-field diagnostics recognize them correctly.
- 68ed464: Render select and typeahead option lists in the browser top layer so they are
  not clipped by cards, modals, drawers, or other overflow-constrained layouts.
  The shared top-layer behavior now also backs dropdown menus.
- 2ff7a1e: Apply the documented spacing token between adjacent segmented-control content,
  including leading icons and their labels.
- b799cb8: Dismiss a tour when a press lands outside its popover, the pointer equivalent
  of the Escape it already handled. The scrim takes no pointer events so the
  spotlit control stays usable, which also meant an outside press reached the
  page underneath: a click on a link navigated away and left the coachmarks
  anchored to a screen that was gone. The press is not swallowed, so it still
  does whatever it normally would.

  Add `renderOption` to the typeahead, so an option list fed as data can draw its
  own rows. A slotted `fluid-option` has always been free to contain anything,
  but options supplied as an array or from an async loader could only ever be a
  string, leaving consumers to join fields into one label with separators. That
  cannot right-align a value, cannot hold a checkbox, and reads as a single run
  of text to a screen reader. The callback receives the index, the active and
  selected state, the query, and the same highlighter the default row uses, since
  a custom row usually still wants the match marked somewhere.

- 9836631: Center horizontal step indicators on an evenly distributed rail and render
  continuous connector halves between sibling steps. This removes the oversized
  gap after the first step while preserving first and last edge alignment.

## 0.1.2

### Patch Changes

- b134248: Make `fluid-button` submit and reset the nearest light-DOM form when its
  `type` is `submit` or `reset`, and avoid false icon-only warnings while slots
  are still initializing.

## 0.1.1

### Patch Changes

- Updated dependencies
  - @fluid-ds/icons@0.0.3

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
