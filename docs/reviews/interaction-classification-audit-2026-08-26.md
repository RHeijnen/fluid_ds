# Interaction applicability audit, 2026-08-26

Scope: the 155 elements in `quality/component-quality.json`. This is a source
classification audit, not a claim that new interaction tests have passed.

## Counting rule

Count each published element that owns user-operable behavior, including
interactive children of composite widgets. A helper label must not hide a
button, link, dismiss action, selectable item, or keyboard-scroll surface.
Consumer-authored buttons in otherwise passive slots do not make every layout
element interactive.

Parent stories may eventually prove child contracts, but only through explicit
child assertions and an auditable coverage mapping. Parent coverage is not
automatically credited to children. No covered count was increased in this audit.

## Corrections

| Elements                                                                                                                                                                                    | Previous category | Correct category | Source evidence                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fluid-truncate`                                                                                                                                                                            | helper            | interactive      | Its component renders a disclosure button with `aria-expanded` and dispatches `fluid-toggle`.                                                                                                                                                               |
| `fluid-scroller`                                                                                                                                                                            | helper            | interactive      | Its internal scroll container is keyboard-focusable and updates edge fades on scroll.                                                                                                                                                                       |
| `fluid-list-item`, `fluid-nav-item`                                                                                                                                                         | helper            | interactive      | Row button/link activation and navigation are owned by the child elements.                                                                                                                                                                                  |
| `fluid-dropdown-item`, `fluid-menu-item`, `fluid-option`, `fluid-segment`, `fluid-tab`, `fluid-tree-item`                                                                                   | helper            | interactive      | Focus, selection, disabled state, or activation are user-visible child contracts even where the parent coordinates them.                                                                                                                                    |
| `fluid-toast-item`                                                                                                                                                                          | helper            | interactive      | It renders a dismiss button with its own dismissal behavior.                                                                                                                                                                                                |
| `fluid-step`                                                                                                                                                                                | presentational    | interactive      | With a clickable parent, the child renders a native button. Applicability includes supported non-default states.                                                                                                                                            |
| `fluid-chart`, `fluid-bar-chart`, `fluid-bubble-chart`, `fluid-doughnut-chart`, `fluid-line-chart`, `fluid-pie-chart`, `fluid-polar-area-chart`, `fluid-radar-chart`, `fluid-scatter-chart` | presentational    | composite        | `FluidChart` enables Chart.js legend and tooltip behavior; typed wrappers inherit it. The installed Chart.js 4.5.1 legend click handler changes dataset visibility. These need interaction and keyboard-equivalence review, not a presentational exemption. |

Result: 21 additions to applicability, from 82 to 103. There are still 64
explicitly attributed representative contracts: 64/103 (62.1 percent), with 39
unattributed or missing element contracts. Catalog-wide coverage remains 64/155
(41.3 percent). The former 18 gaps remain; the extra 21 are newly visible gaps,
not regressions introduced into component behavior.

## Remaining non-interaction classifications

These exclusions apply only to the representative user-interaction denominator.
They do not exempt accessibility, rendering, data-update, lifecycle, SSR,
localization, security, or visual contracts.

| Group                              | Elements (all prefixed `fluid-`)                                                                                                                                                                                                                                                                          | Rationale                                                                                                                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Passive content and feedback       | avatar, avatar-group, badge, card, countdown, description-item, description-list, divider, empty-state, hero, icon, image, loading-overlay, markdown, meter, page, pricing-table, pricing-tier, progress-bar, progress-ring, qr-code, result, skeleton, sparkline, spinner, stat, timeline, timeline-item | No library-owned user action. Sparkline explicitly disables legend and tooltip. Image/network recovery, countdown updates, markdown sanitization, canvas semantics, and animation controls still require non-interaction coverage. |
| Structural containers              | aspect-ratio, button-group, carousel-item, col, grid, kbd, menu-label, mosaic-item, stack, tab-panel                                                                                                                                                                                                      | Layout, labels, or content panels; interactive descendants are classified separately.                                                                                                                                              |
| Form and overlay infrastructure    | field, fieldset, popup                                                                                                                                                                                                                                                                                    | Accessible wiring, group state, and positioning are verified through their own unit tests and consumer compositions. No independent activation surface.                                                                            |
| Formatting, effects, and observers | animation, celebrate, format-bytes, format-date, format-number, include, intersection-observer, mutation-observer, relative-time, resize-observer                                                                                                                                                         | Data, lifecycle, motion, loading, or observation behavior rather than library-owned user input. They remain in the full-catalog gates.                                                                                             |
| Navigation container               | breadcrumb                                                                                                                                                                                                                                                                                                | Link behavior belongs to the separately counted breadcrumb-item. Container semantics still require accessibility checks.                                                                                                           |

The 52 remaining exclusions comprise 29 presentational elements and 23 helpers.
Re-audit if any of these elements adds a native control, actionable role, or
library-owned user gesture. This audit does not certify the correctness of their
semantics or the completeness of existing tests.
# Follow-up correction: mosaic

The Section 2 implementation audit found that `fluid-mosaic` has no input
handlers, interactive role, selection state, or interaction events. It only
maps layout properties to CSS grid variables and renders a slot. It belongs in
`helper`, alongside `fluid-grid` and `fluid-mosaic-item`, not `composite`.
Slotted links keep their own native behavior; testing their Tab order is useful
layout evidence, not an interaction implemented by mosaic.

This correction reduces the applicable denominator from 103 to 102. It adds
zero covered interactions and does not remove mosaic's unit, accessibility,
layout or visual obligations. Counts from earlier evidence remain historical.
