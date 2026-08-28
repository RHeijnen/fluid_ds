# @fluid-ds/table

## 0.4.0

### Minor Changes

- Localize simple and infinite table controls, selection labels, result counts, and live column
  announcements, with locale-aware numbers and right-to-left direction.
- Harden infinite-table virtualization and reconnect behavior, expose accurate virtual row
  metadata, and add controlled sorting without mutating the supplied rows or sort state.
- Improve column interaction with keyboard reordering and resizing, stable drag cancellation,
  truncated narrow cells, and an opt-in synchronized horizontal column scrollbar.

## 0.1.2

### Patch Changes

- 5c33613: Steady the infinite table's columns. Header labels start where their cells
  start — the reorder handle overlays the header instead of pushing the label
  out of line — and both headers and cells truncate with an ellipsis when a
  column is narrowed. A trailing filler column takes the table's spare width,
  so a column renders at exactly the width it was given; starting a resize pins
  the flexible columns where they stand, so a drag moves one edge only. A
  header is dragged by any point of itself, and a pointer reorder rearranges
  the columns live as a preview: the drop commits it, a cancelled drag puts the
  original order back, and only the drop is reported.

## 0.1.0

### Minor Changes

- b134248: Add a separate `fluid-infinite-table` for large operational datasets with rich
  cell templates, infinite loading, row windowing, sticky projected filters and
  headers, server-controlled sorting, and configurable serializable columns.

## Unreleased

### Minor Changes

- Add `fluid-infinite-table`, a separate advanced table for asynchronously
  loaded operational datasets. It provides rich cell and header renderers,
  nested property paths, projected sticky filters, sticky headers, fixed-height
  row windowing, an infinite-load sentinel, server-controlled sorting, and a
  serializable column visibility and ordering dialog. The existing
  `fluid-table` remains unchanged.

## 0.0.3

### Patch Changes

- db0556c: Add five new opt-in expansion packs, each to the authoring standard (WCAG 2.2
  AA, component-scoped tokens, story + docs page + playground card + tests):
  - **`@fluid-ds/table`** (`fluid-table`): an accessible data grid: semantic
    `<table>`, sortable column headers (`aria-sort`), row selection with an
    indeterminate select-all, string + numeric aware sorting. Events
    `fluid-sort` / `fluid-selection-change`.
  - **`@fluid-ds/calendar`** (`fluid-event-calendar`): a month view that displays
    events (distinct from the booking scheduler): `role="grid"` with roving
    tabindex, event chips with a "+N more" overflow, prev/next month nav. Events
    `fluid-month-change` / `fluid-day-click` / `fluid-event-click`.
  - **`@fluid-ds/editor`** (`fluid-rich-text-editor`): a lightweight WYSIWYG: a
    roving-tabindex toolbar (bold / italic / underline / lists / link / clear)
    over a `role="textbox"` contenteditable region. `value` get/set + `fluid-change`.
  - **`@fluid-ds/kanban`** (`fluid-kanban`): a drag-and-drop board with a full
    keyboard path (pick up / move / drop, announced via a live region). Event
    `fluid-move`.
  - **`@fluid-ds/map`** (`fluid-map`): a themed Leaflet wrapper (light-DOM render,
    CSS auto-loaded), markers, and `fluid-marker-click` / `fluid-move` events.
    Requires the `leaflet` peer at runtime.
