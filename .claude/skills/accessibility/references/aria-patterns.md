# ARIA patterns cheat sheet

Reference card for every WAI-ARIA Authoring Practices Guide (APG) design pattern, plus the patterns a design system must ship that APG does not cover. Use this when wiring roles, states, properties, and keyboard handlers on Fluid components.

Primary source for everything below: <https://www.w3.org/WAI/ARIA/apg/patterns/>. When this file does not quote a pattern's full keyboard contract verbatim, fetch the linked APG page and quote it, do not paraphrase from memory.

---

## Two cross-cutting rules (verified)

### Keyboard convention

Source: <https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/>

1. **Tab and Shift+Tab move BETWEEN widgets.** Arrow keys, Home, End, PageUp, PageDown move WITHIN a composite widget once it contains focus. Composites include menu, menubar, listbox, tree, grid, radio group, tablist, toolbar, carousel.
2. **Tab order follows DOM order.** `tabindex="0"` inserts the element at its DOM position. `tabindex="-1"` makes the element focusable programmatically but skipped by sequential Tab navigation. **Positive `tabindex` values are strongly discouraged** because they decouple visual / DOM / focus order and almost always break.
3. Implementation choice for composites:
   - **Roving tabindex**: exactly one descendant has `tabindex="0"`, all others `tabindex="-1"`. On arrow key, swap the values and call `.focus()` on the new active element.
   - **`aria-activedescendant`**: DOM focus stays on the container; `aria-activedescendant` points at the ID of the currently active child. The active child needs an `id`, the container needs `tabindex="0"`.

### ARIA version note

The current W3C Recommendation is **WAI-ARIA 1.2** (<https://www.w3.org/TR/wai-aria-1.2/>). APG patterns and every "required ARIA" line below assume 1.2.

**WAI-ARIA 1.3** is a Working Draft and relaxes some currently-required attributes. The most prominent example: under 1.2 `aria-controls` is **required** on `role="combobox"`; under 1.3 it becomes optional. Do NOT flip Fluid components to the 1.3 rules until 1.3 reaches Recommendation. When it does, re-audit every pattern below against the published 1.3 text.

---

## APG patterns (all 30)

The APG patterns directory enumerates exactly these 30 patterns: Accordion, Alert, Alert Dialog, Breadcrumb, Button, Carousel, Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid, Landmarks, Link, Listbox, Menu and Menubar, Menu Button, Meter, Radio Group, Slider, Slider (Multi-Thumb), Spinbutton, Switch, Table, Tabs, Toolbar, Tooltip, Tree View, Treegrid, Window Splitter. Source: <https://www.w3.org/WAI/ARIA/apg/patterns/>.

---

### Accordion

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/accordion/>
- **Required ARIA**: Each header trigger is a native `<button>` with `aria-expanded="true|false"` and `aria-controls="<panel-id>"`. Each panel has `id` matching `aria-controls` and `role="region"` with `aria-labelledby="<trigger-id>"` (or another accessible name).
- **Optional ARIA**: Headers may sit inside `<h2>`–`<h6>` so the panel headings appear in the document outline. APG recommends: not requires, wrapping each trigger in an appropriate heading.
- **Keyboard contract**: Tab moves to the next trigger (each trigger is in the Tab sequence). Enter / Space toggles the panel. Optional arrow / Home / End navigation between triggers: APG lists these as recommended but not required; fetch the APG page for the verbatim table before shipping.
- **Focus model**: DOM focus only; each header button is independently tabbable.
- **Mistakes to avoid**: (1) Using a `<div>` or `<a>` instead of `<button>` for the trigger: kills Space/Enter activation and the native focusable behaviour. (2) Forgetting to flip `aria-expanded` synchronously with the open/close state. (3) Hiding collapsed panels with `visibility:hidden` while leaving their descendants in the Tab order, use `hidden` attribute or `display:none`.

### Alert

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/alert/>
- **Required ARIA**: `role="alert"` on the container. Equivalent to `aria-live="assertive"` + `aria-atomic="true"`; do not set those manually in addition.
- **Optional ARIA**: None.
- **Keyboard contract**: None: alerts are not interactive widgets. If the alert contains actions, those follow Button / Link rules independently.
- **Focus model**: Focus is not moved. The screen reader interrupts and announces.
- **Mistakes to avoid**: (1) Adding `role="alert"` to an element that already exists in the DOM on page load: AT may miss it; the element must be inserted, OR text content changed, AFTER initial render. (2) Using `role="alert"` for routine confirmations (use `role="status"` / `aria-live="polite"` instead). (3) Wrapping a modal in `role="alert"`, use Alert Dialog.

### Alert Dialog

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/>
- **Required ARIA**: `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the dialog title, `aria-describedby` pointing to the alert message.
- **Keyboard contract + focus model**: Same as Dialog (Modal), below: focus moves into the dialog on open, Tab cycles within, Esc closes, focus returns to the trigger on close.
- **Mistakes to avoid**: (1) Using Alert Dialog for non-urgent confirmations: reserve for interruptions the user must address (data loss, destructive action). (2) Failing to focus a control inside the dialog on open. (3) Omitting `aria-describedby`, the alert text won't be announced with the dialog name.
- **Fetch APG before shipping** for the verbatim focus management contract.

### Breadcrumb

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/>
- **Required ARIA**: A `<nav>` with `aria-label="Breadcrumb"` (or `aria-labelledby`) wrapping an ordered list of links. The current page link has `aria-current="page"`.
- **Optional ARIA**: Separator characters between items should be hidden from AT via `aria-hidden="true"` if they're decorative.
- **Keyboard contract**: Native link Tab order; no special keys.
- **Focus model**: DOM focus only.
- **Mistakes to avoid**: (1) Omitting `aria-current="page"` on the last item: AT can't identify "you are here". (2) Putting separators as text content of the link itself (gets announced). (3) Making the current item a non-link `<span>` without `aria-current`, loses programmatic identification.

### Button (incl. toggle, menu, disclosure variants)

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/button/>
- **Required ARIA**: Prefer native `<button>`. If the host element is not a button, set `role="button"` and `tabindex="0"`, and implement Space + Enter activation manually.
- **Optional / variant ARIA**:
  - **Toggle button**: `aria-pressed="true|false"`. Do not also use `aria-checked`: that's for Switch / Checkbox.
  - **Disclosure button**: `aria-expanded="true|false"` plus `aria-controls="<panel-id>"` (see Disclosure pattern).
  - **Menu button**: `aria-haspopup="menu"` (or `true`) plus `aria-expanded` (see Menu Button pattern).
- **Keyboard contract**: Enter activates. Space activates on key-up (native button behaviour: replicate this if you build a custom one). A toggle button toggles `aria-pressed` on activation.
- **Focus model**: DOM focus only.
- **Mistakes to avoid**: (1) Using `<div role="button">` without handling Space-on-keyup. (2) Mixing `aria-pressed` and `aria-expanded` semantics on the same control. (3) Setting `aria-pressed` on a button that performs an action (it should be a stateful toggle, not a one-shot).

### Carousel

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/carousel/>
- **Required ARIA**: A region container with `aria-roledescription="carousel"` and an accessible name (`aria-label`). Each slide has `aria-roledescription="slide"` and an accessible name; slides are typically `role="group"` or `role="tabpanel"` depending on whether tabs/dots are used.
- **Keyboard contract + focus model**: Multiple valid variants (basic, tabbed, grouped). Fetch the APG page and quote the variant you implement: do not paraphrase.
- **Mistakes to avoid**: (1) Auto-rotating without a pause control (fails SC 2.2.2 Pause, Stop, Hide). (2) Auto-rotating while focus is inside the carousel (must pause). (3) Using `aria-live` on the slide container: screen readers will announce every rotation.

### Checkbox (incl. tri-state)

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/>
- **Required ARIA**: Native `<input type="checkbox">` when possible. Custom: `role="checkbox"`, `tabindex="0"`, `aria-checked="true|false|mixed"`. The accessible name comes from `<label>`, `aria-labelledby`, or `aria-label`.
- **Tri-state**: `aria-checked="mixed"` for the indeterminate state.
- **Keyboard contract**: Space toggles. (Native checkbox does not respond to Enter: your custom implementation should match.)
- **Focus model**: DOM focus only.
- **Mistakes to avoid**: (1) Using `aria-checked="true|false"` on a native checkbox: the browser already exposes the state; double-binding leads to drift. (2) Forgetting `aria-checked="mixed"` for tri-state; `null` / absent is not equivalent. (3) Making the entire label clickable but not associating it (no `<label for>` / not wrapping the input).

### Combobox (all four autocomplete variants)

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/combobox/>
- APG definition: "An input widget that has an associated popup."
- **Required ARIA (WAI-ARIA 1.2)**:
  - `role="combobox"` on the editable input element.
  - `aria-expanded="true|false"` reflecting popup visibility.
  - `aria-controls="<popup-id>"` referencing the popup (listbox, grid, tree, or dialog).
  - `aria-autocomplete` set to one of the four variants below.
  - The popup itself has its own role: `listbox` (most common), `grid`, `tree`, or `dialog`.
- **Four autocomplete variants** (`aria-autocomplete` values):
  - `"none"`: no suggestions filtered as the user types; popup shows the full list.
  - `"list"`: suggestions filtered by typed value; user must select manually.
  - `"both"`: inline completion in the input PLUS a filtered list; first match is auto-selected.
  - `"inline"`: inline completion in the input, no visible list.
- **Focus model**: DOM focus stays on the combobox input. AT focus inside the popup is managed via `aria-activedescendant` pointing at the active option's `id`. **Exception**: when the popup is `role="dialog"`, DOM focus moves into the dialog.
- **Keyboard contract**: Down Arrow opens the popup / moves to next option. Up Arrow moves to previous. Enter selects. Esc closes the popup (and clears the input on second press in some variants). Home/End move to first/last option in the popup. Fetch APG for the exact per-variant table.
- **Mistakes to avoid**: (1) Setting `role="combobox"` on a wrapping `<div>` instead of the input element: invalid in ARIA 1.2 (which moved combobox role onto the textbox/input). (2) Moving DOM focus to the listbox option on arrow, must stay on input via `aria-activedescendant`, except for the dialog variant. (3) Forgetting `aria-controls` (still required under 1.2; will become optional in 1.3). (4) Not syncing `aria-expanded` with popup open/closed state.

### Dialog (Modal)

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
- **Required ARIA**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (or `aria-label`) for the dialog title.
- **Optional ARIA**: `aria-describedby` pointing at descriptive content.
- **Focus management contract** (paraphrased: fetch APG for verbatim wording before implementing):
  - On open: move focus into the dialog (usually the first focusable element, or the dialog container if it has `tabindex="-1"`).
  - While open: focus is trapped: Tab from last element wraps to first; Shift+Tab from first wraps to last.
  - Esc closes the dialog.
  - On close: focus returns to the element that triggered the dialog.
- **Mistakes to avoid**: (1) Trapping focus by listening to Tab and re-focusing the first element: also catch Shift+Tab. (2) Leaving the page background interactive (must be inert / `inert` attribute / `aria-hidden` siblings). (3) Returning focus to `<body>` instead of the trigger on close.
- **Fetch APG before shipping** for the verbatim focus contract.

### Disclosure

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/>
- **Required ARIA**: A `<button>` trigger with `aria-expanded="true|false"` and `aria-controls="<panel-id>"`.
- **Keyboard contract**: Enter / Space toggles.
- **Focus model**: DOM focus only.
- **Mistakes to avoid**: (1) Using `<details>`/`<summary>` and ALSO adding `aria-expanded`: the browser already provides it. (2) Animating the panel with `max-height` but leaving its descendants in the Tab order while collapsed.

### Feed

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/feed/>
- **Required ARIA**: Container `role="feed"`. Each article inside has `role="article"`, `aria-posinset="<n>"`, `aria-setsize="<total or -1 if unknown>"`, `aria-labelledby` for the article's accessible name.
- **Keyboard contract**: Page Down / Page Up move between articles. Control+End moves to last loaded article, Control+Home to first. Fetch APG before shipping for the verbatim table.
- **Focus model**: DOM focus on the current article (`tabindex="0"` on the focused article, `-1` on others: roving tabindex).
- **Mistakes to avoid**: (1) Using `role="feed"` for a static list: feed implies dynamic / paginated content. (2) Setting `aria-busy="true"` permanently instead of only during load. (3) Hijacking arrow keys (use Page Down / Page Up per APG).

### Grid

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/grid/>
- **Required ARIA**: `role="grid"`, with `role="row"` children and `role="gridcell"` (or `columnheader` / `rowheader`) descendants. For multi-selectable grids, `aria-multiselectable="true"`; selected cells use `aria-selected="true"`.
- **Focus model**: Roving tabindex OR `aria-activedescendant`. Either the cell or a focusable child within the cell holds focus.
- **Keyboard contract**: Arrow keys move between cells. Home / End move to row start / row end. Control+Home / Control+End move to grid start / end. Page Up / Page Down move by viewport. Fetch APG for the verbatim contract including cell-edit mode.
- **Mistakes to avoid**: (1) Confusing Grid with Table: Grid is for interactive widgets (spreadsheets, data grids with focusable cells); Table is for static data. (2) Mixing roving tabindex with `aria-activedescendant` on the same grid. (3) Not handling Tab, Tab should leave the grid; arrow keys move within.

### Landmarks

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/>
- **Required ARIA**: Prefer native HTML landmark elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>` with accessible name, `<form>` with accessible name). Fall back to roles (`banner`, `navigation`, `main`, `complementary`, `contentinfo`, `region`, `form`, `search`).
- **Accessible names**: When the page has more than one landmark of the same role, give each a unique `aria-label` or `aria-labelledby`.
- **Keyboard contract**: None at the landmark level: AT users navigate landmarks via screen reader shortcuts.
- **Mistakes to avoid**: (1) Multiple `<main>` elements on one page. (2) `role="banner"` / `role="contentinfo"` on elements that are NOT the document-level header/footer (these roles are scoped). (3) Wrapping every section in `role="region"`: only use where the section has a meaningful accessible name.

### Link

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/link/>
- **Required ARIA**: Prefer native `<a href>`. Custom: `role="link"` plus `tabindex="0"`; activation on Enter (links do NOT activate on Space).
- **Keyboard contract**: Enter activates.
- **Mistakes to avoid**: (1) Using `<a>` without `href`: not focusable, not a link. (2) Custom `role="link"` that activates on Space, wrong (that's Button behaviour). (3) Link text of "click here" or "read more" without programmatic context (fails SC 2.4.4).

### Listbox

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/listbox/>
- **Required ARIA**: `role="listbox"` with `role="option"` children. Single-select: `aria-selected="true"` on the chosen option. Multi-select: `aria-multiselectable="true"` on the listbox, `aria-selected` on each option. Options may be grouped with `role="group"` (each group needs an accessible name).
- **Focus model**: Either roving tabindex OR `aria-activedescendant` on the listbox.
- **Keyboard contract**: Arrow keys move between options. Home/End move to first/last. Single-select: focus = selection (typically). Multi-select: Space toggles selection on the focused option; Shift+Arrow extends. Fetch APG for the verbatim table.
- **Mistakes to avoid**: (1) Using `aria-checked` instead of `aria-selected` on options. (2) Multi-select that requires Ctrl+click only (no keyboard equivalent). (3) Listbox option that doesn't have an accessible name (icon-only).

### Menu and Menubar

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/menubar/>
- **Required ARIA**: `role="menubar"` (horizontal) or `role="menu"` (popup); children `role="menuitem"`, `role="menuitemcheckbox"`, or `role="menuitemradio"`. Submenu triggers use `aria-haspopup="menu"` and `aria-expanded`. Checkbox/radio menu items use `aria-checked`.
- **Focus model**: Roving tabindex within the menu / menubar.
- **Keyboard contract**: In a menubar: Left/Right between top-level items, Down opens submenu. In a menu: Up/Down between items, Right opens submenu, Left closes submenu (or moves to prev menubar item). Enter / Space activates. Esc closes. Type-ahead jumps to matching items. Fetch APG for the verbatim table.
- **Mistakes to avoid**: (1) Using Menu/Menubar for static site navigation: that's a `<nav>` with links, not a menu widget. (2) Putting non-menuitem content (free text, headings) inside `role="menu"` (invalid). (3) Skipping type-ahead, APG specifies it.

### Menu Button

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/>
- **Required ARIA**: A `<button>` with `aria-haspopup="menu"` (or `true`) and `aria-expanded="true|false"`. The popup is a `role="menu"` (see Menu above).
- **Keyboard contract**: Enter / Space / Down Arrow opens the menu and moves focus to the first item. Up Arrow opens and focuses the last item.
- **Mistakes to avoid**: (1) `aria-haspopup="true"` plus a popup that isn't a menu (use `"listbox"`, `"dialog"`, etc. to match). (2) Not closing the menu when focus moves outside it. (3) Returning focus to `<body>` on close instead of the trigger button.

### Meter

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/meter/>
- **Required ARIA**: Prefer native `<meter>`. Custom: `role="meter"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and an accessible name.
- **Keyboard contract**: None: meters are not interactive.
- **Mistakes to avoid**: (1) Using `role="progressbar"` for a static gauge value (progressbar implies a task in progress). (2) Omitting `aria-valuetext` when the numeric value isn't self-describing (e.g., "67" should be "67 of 100, healthy").

### Radio Group

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/radio/>
- **Required ARIA**: Prefer native `<input type="radio">` grouped by shared `name`, wrapped in `<fieldset>`/`<legend>`. Custom: `role="radiogroup"` with accessible name; children `role="radio"` with `aria-checked="true|false"`.
- **Focus model**: Roving tabindex: the checked radio (or the first if none checked) has `tabindex="0"`, others `tabindex="-1"`.
- **Keyboard contract**: Tab into the group focuses the checked radio. Arrow keys move between radios AND change selection. Space selects the focused radio (when arrow-key auto-selection isn't desired).
- **Mistakes to avoid**: (1) Giving every radio `tabindex="0"`: Tab will visit every option. (2) Moving focus without changing selection (APG specifies arrow-key auto-select). (3) Radiogroup without an accessible name.

### Slider

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/slider/>
- **Required ARIA**: `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, accessible name, `tabindex="0"`. `aria-valuetext` when the numeric value needs context (e.g., dates, ratings).
- **Keyboard contract**: Right/Up increase by step; Left/Down decrease. Page Up / Page Down change by a larger step. Home/End jump to min/max. Fetch APG for the verbatim table.
- **Mistakes to avoid**: (1) Using `<input type="range">` AND `role="slider"` together (double semantics). (2) No Page Up / Page Down handler (mandatory for usable sliders). (3) `aria-valuemin > aria-valuenow > aria-valuemax` not enforced: values must stay in range.

### Slider (Multi-Thumb)

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/>
- **Required ARIA**: Each thumb is its own `role="slider"` with its own `aria-valuemin`, `aria-valuemax` (often constrained by the other thumb), `aria-valuenow`, and accessible name distinguishing the thumbs (e.g., "Minimum price", "Maximum price").
- **Keyboard contract**: Same per-thumb as single Slider. Tab moves between thumbs.
- **Mistakes to avoid**: (1) Single `role="slider"` with two thumbs: fails because only one `aria-valuenow` can be exposed. (2) Letting thumbs cross without updating `aria-valuemax` / `aria-valuemin` accordingly. (3) Generic accessible names ("slider 1", "slider 2").

### Spinbutton

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/>
- **Required ARIA**: Prefer `<input type="number">`. Custom: `role="spinbutton"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, accessible name, `tabindex="0"`.
- **Keyboard contract**: Up/Down arrows increment/decrement. Page Up / Page Down by larger step. Home/End to min/max. User can also type the value directly.
- **Mistakes to avoid**: (1) Not allowing direct typing. (2) Snapping to step on every keystroke (only on commit). (3) Allowing values outside min/max.

### Switch

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/switch/>
- **Required ARIA**: `role="switch"`, `aria-checked="true|false"`, accessible name, native focusability (button element or `tabindex="0"`). `aria-checked="mixed"` is **not** allowed on a switch.
- **Keyboard contract**: Space toggles. Enter also toggles (APG recommends supporting both).
- **Mistakes to avoid**: (1) Using `aria-pressed` instead of `aria-checked` (that's Toggle Button). (2) Conveying state with color only (fails SC 1.4.1 Use of Color: the thumb position is the recognised non-color cue). (3) `aria-checked="mixed"` on a switch (invalid).

### Table

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/table/>
- **Required ARIA**: Prefer native `<table>` with `<caption>`, `<thead>`, `<tbody>`, `<th scope="col|row">`. ARIA: `role="table"`, `role="row"`, `role="cell"`, `role="columnheader"`, `role="rowheader"`. Sortable column headers use `aria-sort="ascending|descending|none|other"`.
- **Keyboard contract**: None at the table level: Tab moves to interactive controls within cells. (Interactive tables that need cell-level keyboard navigation should use Grid instead.)
- **Mistakes to avoid**: (1) Using `<div>`s with no roles: AT can't navigate. (2) Putting `aria-sort` on the sort button instead of the `<th>` (the column header is the right host). (3) Using Table when cells need to be individually focusable, that's Grid.

### Tabs (manual + automatic activation)

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/tabs/>
- **Required ARIA**: `role="tablist"` containing `role="tab"` children; each tab has `aria-selected="true|false"` and `aria-controls="<panel-id>"`. Each `role="tabpanel"` has `aria-labelledby="<tab-id>"` and `tabindex="0"` if it doesn't contain focusable content.
- **Focus model**: Roving tabindex on tabs.
- **Activation modes**:
  - **Automatic**: arrow key moves focus AND activates the new tab (panel updates immediately).
  - **Manual**: arrow key moves focus only; Enter / Space activates the focused tab. Use manual when activating the tab is expensive (loads remote content, triggers analytics).
- **Keyboard contract**: Left/Right (horizontal tablist) or Up/Down (vertical) between tabs. Home/End to first/last. Tab leaves the tablist and moves into the active panel.
- **Mistakes to avoid**: (1) Mixed mode: arrow auto-activates AND Enter activates again (double-fire). (2) Forgetting `aria-selected="false"` on inactive tabs. (3) Tabpanel without `tabindex="0"` when it has no focusable content (Tab from tablist falls through to next widget).

### Toolbar

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/>
- **Required ARIA**: `role="toolbar"` with accessible name. Children are buttons, toggle buttons, links, menu buttons, etc.
- **Focus model**: Roving tabindex.
- **Keyboard contract**: Arrow keys move between controls. Tab moves out of the toolbar. Home/End to first/last control.
- **Mistakes to avoid**: (1) Every toolbar button having `tabindex="0"`: defeats the roving-tabindex contract. (2) Using `role="toolbar"` for unrelated controls (toolbar implies a related set of frequently-used actions). (3) Nested toolbars (not supported).

### Tooltip

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/>
- **Required ARIA**: `role="tooltip"` on the bubble, with an `id` referenced by the target element's `aria-describedby`.
- **Keyboard contract**: Tooltip appears on hover AND focus. Esc dismisses the tooltip without moving focus (SC 1.4.13 Content on Hover or Focus requirement).
- **Focus model**: DOM focus stays on the trigger: never on the tooltip.
- **Mistakes to avoid**: (1) Tooltip on a non-focusable element (keyboard users can't reveal it). (2) Tooltip used as the only label (`aria-labelledby` to a tooltip is fragile: use `aria-label` or visible label instead). (3) No Esc-to-dismiss (fails SC 1.4.13).

### Tree View

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/treeview/>
- **Required ARIA**: `role="tree"` container; `role="treeitem"` for each node; parent nodes have `aria-expanded="true|false"`. Selection state via `aria-selected`. Group children of an expanded node go inside `role="group"`.
- **Focus model**: Roving tabindex on tree items.
- **Keyboard contract**: Up/Down move between visible items. Right opens a closed parent OR moves to first child of an open parent. Left closes an open parent OR moves to the parent of a leaf. Enter activates (single-select trees may select on focus). Home/End to first/last visible. Type-ahead. Fetch APG for the verbatim table.
- **Mistakes to avoid**: (1) Using Tree for a flat list: that's Listbox. (2) Mixing single-select-follows-focus and explicit-Enter-to-select. (3) Not handling Left/Right per the APG contract.

### Treegrid

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/>
- **Required ARIA**: `role="treegrid"`; rows are `role="row"` with `aria-level`, `aria-posinset`, `aria-setsize`, and `aria-expanded` for parent rows. Cells are `role="gridcell"` / `columnheader` / `rowheader`.
- **Focus model**: Roving tabindex OR `aria-activedescendant`.
- **Keyboard contract**: Combination of Grid + Tree: arrow keys move between cells; Right/Left on the first cell of a row also expand/collapse the row. Fetch APG for the verbatim table.
- **Mistakes to avoid**: (1) Choosing Treegrid when Tree suffices (no need for per-cell columns). (2) Inconsistent handling of Right/Left on first cell vs interior cells. (3) Missing `aria-level` on rows.

### Window Splitter

- **APG**: <https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/>
- **Required ARIA**: `role="separator"` on the drag handle, with `tabindex="0"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` (percentage of the primary pane), `aria-orientation="horizontal|vertical"`, accessible name describing the panes.
- **Keyboard contract**: Arrow keys (matching orientation) resize by step. Home/End collapse to min/max. Enter restores. Fetch APG for the verbatim table.
- **Mistakes to avoid**: (1) Drag-only (mouse) without keyboard resize: fails SC 2.1.1 Keyboard. (2) `role="separator"` without `aria-orientation`. (3) No accessible name (handle is anonymous to AT).

---

## Patterns NOT in APG

These ship in every design system but have no APG page. Pick the closest analog and document the stance in the component's accessibility notes.

### Toast / Snackbar

- **Closest APG analog**: Alert (urgent) or Status Message technique (non-urgent).
- **Design-system stance**: Default to `role="status"` (polite live region) for confirmations. Use `role="alert"` only for errors / interruptions the user must act on. Toasts must be dismissable by keyboard, must not steal focus, and must be persistent enough that AT can announce them (research suggests min ~6s for normal, longer for action-required). Action buttons inside the toast are reachable via Tab and follow Button rules.

### Avatar

- **Closest APG analog**: None: avatars are images.
- **Stance**: If the avatar is purely decorative (next to a username already announced), `aria-hidden="true"`. If it stands alone (e.g., assignee chip with no visible name), provide `alt` text or `aria-label` with the person's name. Initials avatars: `aria-label` with the full name, not the initials.

### Badge

- **Closest APG analog**: None: badges are visual annotations on another element.
- **Stance**: If the badge content is essential (e.g., "3 unread"), it must be in the host control's accessible name (e.g., button accessible name = "Inbox, 3 unread"). Visually-hidden text inside the host, or `aria-label` on the host that incorporates the badge value. Do NOT rely on `aria-describedby` to a separate badge node: descriptions are not consistently announced.

### Card

- **Closest APG analog**: None: cards are layout containers.
- **Stance**: Cards do not need a role. If the card is wholly clickable, wrap its content in a single link or button (do NOT add `role="button"` to the card div and put real links inside: nested interactives). If the card has a heading, use heading elements (`<h2>`–`<h4>`) so screen reader users get document structure.

### Skeleton

- **Closest APG analog**: Live region while loading.
- **Stance**: Wrap the loading region in `aria-busy="true"` while content loads, and remove the attribute when content arrives. Skeleton shapes themselves should be `aria-hidden="true"`: they have no semantic value. Respect `prefers-reduced-motion` for shimmer animations (<https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>).

### Pagination

- **Closest APG analog**: Navigation with links + `aria-current`.
- **Stance**: Wrap in `<nav aria-label="Pagination">`. Use links (each goes somewhere) or buttons (drive a JS pager) consistently. Current page: `aria-current="page"`. Disabled prev/next: use `aria-disabled="true"` plus `tabindex="-1"` (or omit the link entirely): do NOT use the `disabled` attribute on an `<a>` (invalid HTML).

### Date Picker

- **Closest APG analog**: Combobox with a `role="dialog"` popup containing a `role="grid"` calendar.
- **Stance**: The trigger is an editable `role="combobox"` (date text input). The popup opens as `role="dialog"` (so DOM focus moves into it, per the combobox dialog-popup exception). The month grid is `role="grid"`; days are `role="gridcell"` (or `role="button"`). Roving tabindex on days. Arrow keys move by day, Page Up / Page Down by month, Shift+Page Up / Shift+Page Down by year, Home / End to start / end of week. The currently focused day has `tabindex="0"`; selected day has `aria-selected="true"`; today has `aria-current="date"`. Fetch APG Combobox + Grid + Dialog before shipping.

### Color Picker

- **Closest APG analog**: A combination of Slider (hue, saturation, lightness, alpha), Spinbutton (numeric channel input), and optionally a `role="application"` 2D area for the saturation/value square.
- **Stance**: The 2D saturation/value canvas must expose `role="slider"` semantics or be wrapped so keyboard users can adjust both axes (e.g., separate H, S, V sliders as a fallback). All channel values must be readable via spinbutton/slider semantics, not just visually. Provide a text input for hex / rgb / hsl values: this is often the most accessible path. Color contrast preview values (when picking text-on-background) should announce the computed ratio.

---

## When in doubt

If this file does not state the verbatim keyboard contract for the pattern you are implementing, **open the APG page and quote it directly** rather than working from this summary. The APG pages are the source of truth for keyboard tables and are updated independently of this cheat sheet.
