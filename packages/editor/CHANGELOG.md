# @fluid-ds/editor

## 0.4.0

### Minor Changes

- Sanitize HTML assigned through `value`, pasted into the editor, or emitted by
  editing, and add a `readonly` mode that keeps content focusable and selectable
  while preventing toolbar and input mutations.

- Localize Fluid-owned toolbar commands, editor names, and link prompts through
  the inherited language context. Toolbar arrow navigation now follows the
  rendered direction while explicit labels and placeholders remain authoritative.

### Patch Changes

- Preserve forward and backward selections across toolbar actions, including
  selections inside nested shadow roots, and discard saved ranges when content
  replacement or sanitization makes them stale.

- Publish the generated custom-elements manifest and make package entry points
  importable in Node-based tooling.

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

- db0556c: Fix three expansion-pack visual bugs (all verified in the browser):
  - **editor**: the toolbar icons were invisible. The inline SVG path fragments
    were built with Lit's `html` tag, which creates them in the HTML namespace, so
    they did not render as SVG geometry inside `<svg>`. They now use the `svg`
    tag, so the path data is SVG-namespaced and the buttons show their icons.
  - **map**: marker icons rendered as broken images. Leaflet's `Icon.Default`
    prepends a (mis)detected `imagePath` to its PNG URLs under the bundled ESM
    build, even when an absolute override is given. The component now uses one
    explicit `L.icon` with absolute CDN URLs (a plain icon uses its URLs verbatim),
    so markers and their shadows load correctly.
  - **kanban**: the drag drop-target highlight displayed incorrectly. It used an
    `outline` with `outline-offset`, which the `overflow: auto` board scroll
    container clips. It now uses an inset box-shadow ring plus a faint accent tint,
    painted inside the column box so it is never clipped.
