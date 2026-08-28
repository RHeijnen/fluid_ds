# Expansion localization and RTL reconciliation, 27 August 2026

## Outcome

The current expansion-package source still contains owned English defaults,
complete announcements, accessible names, count grammar and failure wrappers in
the calendar/availability, editor, kanban, node-graph, table, chart, map,
Markdown, QR and parser UI groups. This report reconciles those surfaces against
the source currently in the working tree. It is a disposition and implementation
map, not a literal count, translation-quality claim or runtime certification.

Two historical items are **not open work**:

- scheduler and time-slot localization is a completed bounded contract in
  [the scheduler form review](scheduler-form-contract-2026-08-27.md); only the
  availability editor remains open in that package; and
- parser structured diagnostics are complete in
  [the parser structured-error review](parser-structured-errors-2026-08-27.md).
  The open parser scope is the column-mapper and file-parser presentation layer,
  not another redesign of `coerce.ts`, `apply-blueprint.ts` or `parse-file.ts`.

No runtime, test, package, quality-inventory, shared plan, handoff or defect file
was changed for this reconciliation.

## Scope and ownership rules

The source was read directly from the current checkout. Line numbers below are
exact for that inspected snapshot and may move as parallel implementation lands.
The classifications use the repository's established boundaries:

- **Internal Fluid copy**: fixed labels, announcements, validation copy and
  Fluid-authored sentence assembly. These need registry-backed, live terms.
- **Configurable Fluid default**: a public property or structured override has a
  Fluid English fallback. The default may become locale-derived, but an explicit
  override remains authoritative, including an intentional empty string where
  the current API treats empty as a valid override.
- **Application content**: event/card/column/node/dataset/marker names, editor or
  Markdown content, filenames, field labels, raw values and custom validation
  messages. Preserve it verbatim and pass it only as an argument to a complete
  message where needed.
- **Native/browser UI**: native prompt and input chrome, picker UI and native
  validation affordances. Fluid owns the strings it supplies to those surfaces,
  but not the surrounding browser chrome.
- **Dependency UI**: Chart.js, Leaflet, `marked`, DOMPurify and engine/network
  diagnostics. Do not edit or claim translation of dependency source; define
  integration policy for any visible default or detail.
- **Canonical/non-user text**: ISO dates/times, form and export values, event
  names, MIME types, enum tokens, keyboard identifiers and developer exceptions.
  These stay stable across locale and direction changes.

## Cross-package integration constraint

The calendar, editor, kanban, node-graph, table, charts, map, Markdown and QR
packages currently extend Lit's `LitElement` directly and declare only `lit`
(plus their own runtime libraries) as a peer/runtime dependency. They cannot
silently import the components package's internal localization controller without
an explicit package-dependency and public-architecture decision. Scheduler and
parser already depend on `@fluid-ds/components` and extend `FluidElement`.

Resolve that boundary once before parallel runtime migrations: either establish
a supported shared localization entry point/dependency for expansion packages,
or establish an equivalent public controller contract. Do not create per-package
locale registries or ambient module-global locale state. Whichever path is
chosen must preserve standalone imports, declared-language inheritance across
shadow hosts, deterministic fallback, SSR safety and live locale/direction
updates.

## Current-source inventory

### Calendar and availability

#### Event calendar

Current source:
[fluid-event-calendar.ts](../../packages/calendar/src/components/event-calendar/fluid-event-calendar.ts).

| Lines                     | Current surface                                                                             | Ownership and required boundary                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 293-294, 365-377, 550-555 | Public `locale` drives `Intl.DateTimeFormat` through `locale                                |                                                                                                                                                                                                                             | undefined`; omission therefore uses ambient runtime locale rather than the shared declared-language contract. | Locale/context behavior. Preserve `month` and emitted `YYYY-MM`/`YYYY-MM-DD` values. A valid explicit Intl locale remains independent of dictionary availability. |
| 505, 514                  | `Previous month`, `Next month`.                                                             | Internal copy. Existing shared terms `previousMonth` and `nextMonth` are exact candidates.                                                                                                                                  |
| 556-557                   | `date, N event(s)`.                                                                         | Internal complete count message. `dateLabel` is a localized display argument; event titles remain application content. Use plural grammar rather than an English suffix.                                                    |
| 582, 585                  | Event title in tooltip and visible chip.                                                    | Application content; preserve verbatim.                                                                                                                                                                                     |
| 590-603                   | `Show all N events on date` and `+N more`.                                                  | Internal complete messages with localized counts. Do not concatenate a reusable `showMore` fragment.                                                                                                                        |
| 412-475, 505-517          | Grid and event-chip arrow behavior plus fixed left/right chevrons have no direction branch. | RTL interaction/layout contract. Decide logical previous/next visual treatment and whether horizontal day movement follows the rendered grid in RTL; do not reverse vertical, Home/End or PageUp/PageDown behavior blindly. |

Focused tests should cover inherited and explicit `nl`, `de`, `fr`, `es` and
`ar`; live language changes; singular and non-English plural categories; event
titles containing unusual text; stable ISO event payloads; Arabic grid order,
roving focus, event-chip traversal, month navigation and chevron presentation;
standalone import; and representative SSR/hydration after the shared expansion
localization path is established. Existing month-label and keyboard tests are
useful baselines but do not cover the shared locale or RTL contract.

#### Availability editor

Current source:
[fluid-availability-editor.ts](../../packages/scheduler/src/components/availability-editor/fluid-availability-editor.ts).

| Lines                                              | Current surface                                                                                     | Ownership and required boundary                                                                                                                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 149-150, 191-194                                   | Public locale and ambient `Intl` weekday names.                                                     | Configurable locale/context. Align with declared-language inheritance while preserving an explicit locale and the weekday-number model.                                                |
| 298-320                                            | `Slot rules`; four settings labels; `Weekly hours`.                                                 | Internal copy. `min` and `hours` inside parentheses are display abbreviations, not canonical units. Prefer whole labels over stitching `minutesShort`/`hoursShort` into English order. |
| 329, 344, 353, 362                                 | Open, opening-time, closing-time and remove-window accessible names containing weekday and ordinal. | Internal complete messages with an application/Intl weekday argument and localized displayed index.                                                                                    |
| 367-369                                            | `Opening time must be before closing time.`                                                         | Internal validation message. The `HH:mm` draft values and availability payload remain canonical.                                                                                       |
| 373, 376                                           | `+ Hours`, `Closed`.                                                                                | Internal actions/state copy. Avoid reusing generic `hoursShort` for the action.                                                                                                        |
| 382-402                                            | Closed-date group/title, picker label, all-day status, remove and add actions.                      | Internal copy. Preserve ISO exception dates and existing special-hours records.                                                                                                        |
| native `input[type=time]` and composed date picker | Browser/picker chrome.                                                                              | Native/browser boundary. Fluid owns its accessible names; it does not own browser time/date chooser chrome.                                                                            |

Do not reopen `fluid-scheduler` or `fluid-time-slots`. Availability tests should
add explicit-overrides/context and live-locale cases; canonical payload equality
across locale changes; invalid-window announcements; localized weekday and
number arguments; Arabic logical layout/focus order; composed date-picker
context; reconnect; and all three browser engines. Preserve the existing tests
for fractional notice hours, special-date windows and invalid drafts.

### Rich-text editor

Current source:
[fluid-rich-text-editor.ts](../../packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.ts).

| Lines                     | Current surface                                                                            | Ownership and required boundary                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 34-40                     | `Bold`, `Italic`, `Underline`, `Bullet list`, `Numbered list`, `Link`, `Clear formatting`. | Internal toolbar names. They are fixed module constants today, not caller overrides.                                                                         |
| 175-179                   | Public `label = "Rich text editor"`; empty-default placeholder.                            | Label is a configurable Fluid default. Placeholder is application content and empty is meaningful; never replace a supplied placeholder by English matching. |
| 262-264                   | Fluid supplies `Link URL` to `window.prompt`.                                              | The prompt text is Fluid-owned; surrounding prompt chrome is native/browser-owned. Preserve the entered URL as application content.                          |
| 338, 346                  | `Formatting` toolbar name and command accessible names.                                    | Internal copy.                                                                                                                                               |
| 164-170, 272-309, 372-375 | Sanitized HTML value, pasted document content and emitted HTML.                            | Application content/canonical output. Locale changes must not rewrite, re-sanitize or emit content. DOMPurify behavior is dependency-owned.                  |
| 312-331                   | Horizontal toolbar arrow order is always physical LTR.                                     | RTL interaction contract. Confirm toolbar authoring-practice behavior and rendered order before changing keys; Home/End remain endpoints.                    |

Tests should prove live locale changes update accessible names without executing
commands, moving selection, prompting, emitting `fluid-change` or changing HTML;
explicit label/placeholder behavior; localized prompt input with entered URL
preserved; Arabic toolbar traversal; readonly behavior; backward selection; and
sanitization invariants. The current deep selection and command tests are
regression requirements, not localization coverage.

### Kanban and node graph

#### Kanban

Current source:
[fluid-kanban.ts](../../packages/kanban/src/components/kanban/fluid-kanban.ts).

| Lines             | Current surface                                                                              | Ownership and required boundary                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 197-201           | Four public move-label defaults.                                                             | Configurable Fluid defaults. Preserve every explicit value, including empty strings.                                                                                            |
| 263, 328-338, 352 | Moved/position, dropped, picked-up instructions and cancellation announcements.              | Internal complete messages. Card and column titles are application arguments; positions/counts require localized display numbers and sentence grammar.                          |
| 400-401, 458      | `Draggable card`, `Kanban board`.                                                            | Internal accessible names/role description.                                                                                                                                     |
| 407-410, 445-447  | Card title/description, column title and raw count badge.                                    | Application content; preserve. The hidden count is not itself a spoken owned sentence.                                                                                          |
| 362-380, 413-424  | Left/right keys and arrow glyphs drive previous/next array columns with no direction branch. | RTL workflow. Keep data-array and emitted destination semantics stable, but make key/glyph behavior agree with the rendered logical column order. Up/down remain within-column. |

#### Node graph

Current source:
[fluid-node-graph.ts](../../packages/node-graph/src/components/node-graph/fluid-node-graph.ts).

| Lines                          | Current surface                                                                  | Ownership and required boundary                                                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 75-90                          | Fifteen default announcement/name templates.                                     | Configurable Fluid defaults through `messages`; current `??` fallback at 520-521 preserves an intentional empty override. Translate whole templates, not fragments.                                                           |
| 425-429                        | Partial message overrides and `label = "Node graph"`.                            | Configurable defaults. Preserve partial overrides and empty values.                                                                                                                                                           |
| 484-485, 1009, 1016-1017, 1029 | Node/type/port labels and summaries.                                             | Application content. Pass through unchanged inside complete messages.                                                                                                                                                         |
| 639                            | Zoom percentage uses `Math.round` plus an English template.                      | Internal message plus formatted numeric argument. Do not change canonical `zoom` or emitted viewport values.                                                                                                                  |
| 804-827, 894-899               | Canvas pan, node movement and candidate cycling use physical arrow mappings.     | Distinguish spatial/physical graph movement from logical reading-order controls. RTL must not blindly reverse node coordinates or pan; candidate order and any visual port-side mirroring need an explicit behavior contract. |
| 1048                           | Fixed `node graph editor` role description bypasses the overridable message set. | Internal copy; reconcile with `nodeRole`/label without silently changing override precedence.                                                                                                                                 |

Kanban and node graph can share implementation mechanics for typed complete
movement messages, but not terms whose spatial semantics differ. Tests should
cover all complete message variants, explicit partial/empty overrides, unusual
application titles, localized numeric arguments, locale changes while picked up
or connecting, no replayed events/focus, and real Arabic keyboard/layout flows.
For node graph, retain physical-coordinate/pan assertions and separately prove
the chosen logical candidate/port contract.

### Tables

Current sources:
[fluid-table.ts](../../packages/table/src/components/table/fluid-table.ts) and
[fluid-infinite-table.ts](../../packages/table/src/components/infinite-table/fluid-infinite-table.ts).

| Source lines                                        | Current surface                                                              | Ownership and required boundary                                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table 197-213, 347-392                              | Column labels, caption and cell/row data.                                    | Application content. Sorting uses canonical keys/directions and must not translate values. Whether locale-sensitive collation changes is a separate behavior decision, not an incidental string migration. |
| table 340, 380                                      | `Select all rows`, `Select row N`.                                           | Internal accessible names with localized displayed index.                                                                                                                                                  |
| infinite 709-719                                    | Resize, reorder and column-position templates are public overrides.          | Configurable Fluid defaults. Current raw template replacement is not typed grammar; preserve explicit and empty overrides during any registry fallback.                                                    |
| infinite 1444-1452                                  | Column-position announcement.                                                | Complete configurable message; column label is application content, position/count are localized display numbers.                                                                                          |
| infinite 1693-1749                                  | `Table columns`, close settings, move earlier/later and `Done`.              | Internal copy except column labels. `done` may be shared only if the same action meaning is accepted.                                                                                                      |
| infinite 1766-1785                                  | `0 results`, loaded/of/matching/total status assembly and `Columns`.         | Internal complete status messages with plural/number grammar. Do not translate via fragments such as generic `loading`.                                                                                    |
| infinite 1935-1954                                  | Application-provided error/slot, `No results`, and three loading/end states. | `error` and slotted error/empty content are application-owned overrides; built-in empty and sentinel fallbacks are internal defaults. Explicit slots/properties win.                                       |
| infinite 1276-1279, 1365-1386, 1481-1486, 1517-1523 | Resize and reordering already branch on computed direction.                  | Retain this real RTL behavior. Add localization without regressing logical wider/narrower, forward/backward or drop-edge behavior.                                                                         |

Implement the simple and infinite tables together so selection, result-count and
column terminology is coherent. Tests should cover plural categories and locale
numbering; explicit template and empty-slot precedence; application cell/error
content; live locale updates without sort/layout/selection events; SSR/hydration;
and existing LTR plus Arabic RTL resize/reorder pointer and keyboard behavior.

### Charts and map

#### Chart family

All typed chart elements delegate to
[fluid-chart.ts](../../packages/charts/src/components/chart/fluid-chart.ts), so
one migration covers bar, bubble, doughnut, line, pie, polar-area, radar and
scatter charts. Sparkline has no confirmed owned copy in its current runtime;
that remains a reviewed boundary, not whole-component certification.

| Lines   | Current surface                                                              | Ownership and required boundary                                                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 154-161 | Data/options plus `label = "Chart"`.                                         | Data/dataset labels/options are application/dependency inputs. `Chart` is a configurable Fluid accessible-name default; explicit label wins.                                                              |
| 313-355 | Doughnut center `Total` and `total.toLocaleString()` with ambient locale.    | Configurable Fluid default: `options.plugins.fluidCenterText.label`, including an explicit empty label, wins. The fallback term and number formatting need declared locale; data values remain unchanged. |
| 466-473 | Unlabelled legend fallback `${label} N`.                                     | Internal fallback around configurable label and index. Chart.js-provided legend text is application/dependency content and remains verbatim.                                                              |
| 517-530 | Canvas/legend names use public label; fallback slot content is caller-owned. | Preserve explicit label and fallback content.                                                                                                                                                             |

Tests should exercise every wrapper through the shared base, explicit empty and
custom center labels, Arabic and regional number formatting, application dataset
labels, live locale changes without visibility resets or chart events, reconnect,
retheme, reduced motion, standalone import and SSR-safe rendering. Do not claim
Chart.js tooltip or scale UI is Fluid-translated when it derives from caller data
or dependency callbacks.

#### Map

Current source: [fluid-map.ts](../../packages/map/src/components/map/fluid-map.ts).

| Lines   | Current surface                                                             | Ownership and required boundary                                                                                                                                                                         |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 157-179 | Center/zoom/markers, tile attribution and `label = "Map"`.                  | Map label is a configurable Fluid default. Coordinates, marker content, tile URL and attribution are caller/canonical content.                                                                          |
| 348-399 | Leaflet map, tile and default controls.                                     | Leaflet's built-in zoom-control titles and attribution presentation are dependency-owned UI. Define an integration option or documented boundary; do not patch dependency source or remove attribution. |
| 415-456 | Marker popup/tooltip/title and accessible name use `m.label ?? this.label`. | Marker label is application content. Nullish fallback preserves an explicit empty marker label; keep that behavior.                                                                                     |

Tests should prove label fallback/explicit-empty precedence, marker content
preservation, live locale updates without recreating map state or emitting move,
Leaflet control-title policy, Arabic direction/layout where Leaflet supports it,
reconnect/listener cleanup and unchanged coordinates/events. Existing local
offline fixtures should remain the network-independent behavior path.

### Markdown and QR

#### Markdown

Current source: [fluid-markdown.ts](../../packages/markdown/src/fluid-markdown.ts).

| Lines            | Current surface                                                     | Ownership and required boundary                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 100-120, 134-146 | Value, slot-derived source, URL source and rendered/sanitized HTML. | Application content. Never translate Markdown or generated document text. `marked` parsing and DOMPurify sanitization are dependency behavior.                                                         |
| 137-143          | `Failed to load markdown: ${error.message}`.                        | The wrapper is internal Fluid copy; raw exception detail is browser/network/dependency text. Localize a complete wrapper with an explicit detail policy rather than parsing or translating the detail. |

Tests should cover a localized failure wrapper, unusual/raw error details, live
locale changes after failure, no refetch or duplicate `fluid-render`, unchanged
Markdown/HTML, trusted/sanitized modes, standalone import and SSR/hydration.

#### QR code

Current source: [fluid-qr-code.ts](../../packages/qr/src/fluid-qr-code.ts).

| Lines                     | Current surface                                                       | Ownership and required boundary                                                                                                                                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 104-105                   | Encoded `value`.                                                      | Canonical/application data. Never translate or alter the generated matrix.                                                                                                                                                                                                                                |
| 125-129, 426-434, 477-482 | Public label and derived `QR code for value` / `Empty QR code` names. | Configurable/derived Fluid defaults. The documented current API defines empty `label` as “derive”, so empty is absence here rather than an intentional blank override. Preserve that documented semantic unless an explicit API change is separately approved. The value remains an application argument. |
| 30, 518-528               | Module-resolution and rasterization exceptions.                       | Developer/runtime diagnostics, not current rendered UI. Do not add them to dictionaries merely because they are English.                                                                                                                                                                                  |
| 537                       | Default download filename `qr-code.png`.                              | Canonical filename default, not translated UI; changing it is an API/file-output decision.                                                                                                                                                                                                                |

Tests should cover derived names in all languages, unusual encoded values as
verbatim arguments, explicit nonempty label precedence, the documented empty
label derivation case, live locale updates with byte-identical SVG/module data,
empty value, download output and standalone SSR/import safety.

### Parser presentation layer only

Current sources:
[fluid-column-mapper.ts](../../packages/parser/src/components/column-mapper/fluid-column-mapper.ts)
and
[fluid-file-parser.ts](../../packages/parser/src/components/file-parser/fluid-file-parser.ts).

| Source lines          | Current surface                                                                              | Ownership and required boundary                                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mapper 170-186        | Field label/key, required title, required/unmapped select prompts and source-column options. | Required/prompts are internal. Field labels/keys and source column names are application/imported content and remain verbatim. Native select mechanics are browser-owned.                                     |
| file 181-188          | Accept tokens and public dropzone label default.                                             | Accept extensions are canonical. Label is a configurable Fluid default; preserve explicit values including empty where the composed dropzone API permits it.                                                  |
| file 236-245, 408-417 | Parser error message plus `Could not read filename/the file`.                                | Localize the Fluid wrapper from `ParserFileError.code` when available. Filename is application content. Existing message remains compatibility fallback; raw detail is not translated by matching English.    |
| file 298-316          | Export format, MIME, `data` fallback and `.cleaned` filename segment.                        | Canonical export/file-output behavior, not display localization. Do not change serialized rows or filenames in this tranche.                                                                                  |
| file 319-339          | Ready/duplicate/truncated/error/valid summary assembly.                                      | Internal complete plural messages. Do not retain `(s)` grammar.                                                                                                                                               |
| file 342-393          | Preview caption and cell error tooltip.                                                      | Caption is internal with localized display counts. Cell/field/raw display is application content. For built-ins render localized text from `CellError.diagnostic`; custom-validator message remains verbatim. |
| file 419-452          | Map columns, Preview, Import count, Download actions and Reset.                              | Internal actions/headings. Download format tokens remain canonical labels inside localized complete action text.                                                                                              |

The structured diagnostic work in `packages/parser/src/core` is already complete
and must not be reimplemented. UI tests should cover every built-in diagnostic
code through localized rendering, custom validator text preservation, both
`ParserFileError` codes, compatibility fallback without a diagnostic, unusual
field/raw/filename values, plural categories, live locale changes after errors
exist, no reparsing/refetch/event emission, unchanged parsed/exported values,
explicit dropzone label precedence, native select behavior and all three engines.

## Coherent implementation groups

After the shared expansion-localization entry point is settled, the following
groups are internally coherent and can be implemented and verified independently:

1. **Calendar/availability:** event calendar plus availability editor; explicitly
   exclude scheduler and time slots. Own date/count terms and Arabic date-grid
   workflows here.
2. **Editor:** toolbar/prompt/default names and RTL toolbar behavior, protected by
   the existing selection/sanitization suite.
3. **Spatial tools:** kanban and node graph. Share typed complete-message
   mechanics, but keep logical board order separate from physical graph geometry.
4. **Tables:** simple and infinite table together, including status/count grammar,
   overrides and retention of the existing direction-aware resizing/reordering.
5. **Data visuals:** chart base/family and map. Treat Chart.js/Leaflet UI as
   explicit dependency boundaries and preserve all caller data/options.
6. **Content wrappers:** Markdown and QR. Localize only wrappers/derived accessible
   names; preserve document content, encoded values and developer diagnostics.
7. **Parser UI:** column mapper and file parser only, consuming the already
   completed structured diagnostic contract.

Each group should add terms and typed arguments with its runtime call sites and
focused tests; dictionary-only batches do not close a surface. One owner should
coordinate the shared English contract and official/pseudo dictionaries to avoid
parallel key collisions.

## Likely shared-term collisions

Existing terms in
[localization.ts](../../packages/components/src/internal/localization.ts) should
be reused only when meaning and complete grammar match:

| Existing term                | Likely consumers                                | Collision warning                                                                                                                     |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `previousMonth`, `nextMonth` | Event calendar                                  | Exact accessible-name match; safe candidate. Direction behavior is still separate.                                                    |
| `required`                   | Column mapper                                   | Existing lowercase visible term does not automatically fit title-case `Required`; define casing/context deliberately.                 |
| `remove`                     | Availability, kanban/node graph, table settings | Generic imperative is insufficient for complete names such as “Remove Monday window 2”. Prefer typed whole messages.                  |
| `done`                       | Infinite-table column dialog                    | Likely same action meaning, but do not let this force unrelated flow semantics.                                                       |
| `loading`, `noResults`       | Infinite table                                  | Existing `noResults` is “No results found.” while the current fallback is “No results”; sentinel states need separate complete terms. |
| `minutesShort`, `hoursShort` | Availability settings                           | Abbreviations do not safely compose whole labels across languages.                                                                    |
| `back`, `next`               | Kanban/editor navigation                        | Tour-flow words are not board previous/next-column or physical arrow semantics. Do not reuse by spelling alone.                       |
| `select`                     | Column mapper/table selection                   | Generic “Select…” does not cover “Select a column”, “Select all rows” or “Select row N”.                                              |
| `available`, `selected`      | Availability/parser/table                       | Existing state nouns/adjectives do not replace count sentences.                                                                       |
| `clear`, `undo`              | Editor                                          | `Clear formatting` is not the generic `clear`; no editor undo control exists in the current toolbar.                                  |

New callbacks should take already localized display numbers/dates where their
contract owns sentence order, matching the established countdown/tour pattern.
Do not pass canonical ISO strings when the spoken message needs a localized date,
and do not localize the canonical values themselves.

## Focused verification sequence

For every group:

1. Record a focused failing baseline for missing terms/context/RTL behavior.
2. Test English plus `nl`, `de`, `fr`, `es`, `ar`, regional fallback and both
   pseudo locales where layout is relevant. Dictionary parity is not fluent
   review.
3. Prove explicit overrides, intentional empty values where supported, fallback,
   live locale changes, reconnect and application-content preservation.
4. Prove locale-only changes do not emit business events, replay focus/actions,
   mutate canonical values or restart network/dependency work.
5. Run the owned package typecheck and full browser test file in Chromium,
   Firefox and WebKit with normal supervised teardown; then run shared lint,
   quality/CEM, SSR and documentation gates after source freeze.
6. Add representative SSR/hydration coverage only after the shared standalone
   expansion localization path exists. Retain manual fluent-language, assistive-
   technology and visual Arabic RTL/pseudo-overflow approval as human gates.

## Remaining decision points

- supported localization dependency/entry point for standalone expansion packs;
- exact logical-versus-physical RTL contracts for event-calendar, editor, kanban
  and node graph;
- Leaflet control-title integration policy and raw Markdown/network error-detail
  display policy; and
- whether any public default whose current documentation treats empty as absence
  (notably QR `label`) should ever gain a distinct intentional-empty state. That
  would be a separate API decision, not an implementation assumption.
