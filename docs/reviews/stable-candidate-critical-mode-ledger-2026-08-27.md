# Stable-candidate critical-mode ledger — 2026-08-27

## Disposition

This ledger fixes the denominator for the proposed first stable cohort at **59/59
elements**. It maps current executable evidence to each element without promoting
any maturity label or treating representative checks as exhaustive certification.

The current catalog accessibility report
`apps/a11y/evidence/full-accessibility-regression-2026-08-27-final.json` records
**642/642 passed**, zero skipped, unexpected, or flaky cases across Chromium,
Firefox, and Playwright WebKit (SHA-256
`6499ada859fb5a745a41f4bf8eb78c2e9f45b2b998d234ca0a263ca3835534aa`).
`quality/component-quality.json` independently
attributes a unit-test file, a browser-accessibility fixture, an SSR rendered
fixture, and visual modes to every row. It reports one Storybook interaction for
each interactive/composite candidate and zero for elements deliberately classified
as presentational/helpers. Those quality counts are source attribution, not a
substitute for the retained browser execution.

Depth markers used below:

- **A** — current three-engine catalog accessibility execution (the 642-case run).
- **I** — a source-attributed Storybook interaction for the element.
- **E** — the all-engine environment matrix covers the element or its composite:
  light/dark, forced colors, RTL where applicable, reduced motion, reflow, and
  keyboard operation.
- **R** — a current all-engine disconnect/reconnect and recovery contract covers
  the element or the parent/child composite in which it operates.
- **F** — the 16-control native invalid-focus/form fixture covers this control.
- **S** — the supported pre-registration state-adoption matrix covers this control.
- **—** — that particular depth marker is not currently claimed. It does not mean
  the behavior is absent or broken.

Every row remains open for owner acceptance and manual assistive-technology review.
The `Remaining critical-mode gap` column is deliberately specific enough to route
the next tranche; it is not a claim that all unlisted modes are complete.

The fixed-denominator source/test audit on 28 August classifies 39 rows as
machine-covered by the tranches recorded below. The other 20 rows
retain at least one genuine machine-actionable gap; several descriptions
also contain older fragments that existing tests already cover. This count is a
work-routing denominator, not 34 known runtime defects: each gap requires a
causal test first, and product code changes only when that test reproduces a
behavioral defect. Manual, external, visual, and policy evidence remains separate.

## Foundations (15/15)

| Candidate               | Class          | Unit cases | Depth | Remaining critical-mode gap                                                                                           |
| ----------------------- | -------------- | ---------: | ----- | --------------------------------------------------------------------------------------------------------------------- |
| `fluid-aspect-ratio`    | helper         |         10 | A     | **Machine-covered 2026-08-28:** dynamic-child replacement, invalid-ratio recovery, and measured narrow reflow.        |
| `fluid-avatar`          | presentational |         10 | A     | **Machine-covered 2026-08-28:** real image failure/fallback plus live image, label, initials and icon recovery.       |
| `fluid-avatar-group`    | presentational |         13 | A     | **Machine-covered 2026-08-28:** dynamic membership/max/size reconciliation, overflow semantics, and narrow layout.    |
| `fluid-badge`           | presentational |          8 | A     | **Machine-covered 2026-08-28:** live variant/dot/name semantics and three-engine forced-colors readability.           |
| `fluid-card`            | presentational |          9 | A     | **Machine-covered 2026-08-28:** live section replacement, nested focus order, empty-region hiding, and narrow reflow. |
| `fluid-col`             | helper         |         17 | A     | **Machine-covered 2026-08-28:** invalid span/start/row-span recovery, logical RTL placement, and narrow containment.  |
| `fluid-divider`         | presentational |          7 | A     | **Machine-covered 2026-08-28:** live orientation/name synchronization and system-color forced-colors visibility.      |
| `fluid-grid`            | helper         |         17 | A     | **Machine-covered 2026-08-28:** live columns/breakpoints, invalid count/token recovery, RTL, and narrow containment.  |
| `fluid-icon`            | presentational |         10 | A     | **Machine-covered 2026-08-28:** late/missing icon recovery, live decorative/named semantics, and forced colors.       |
| `fluid-loading-overlay` | presentational |         17 | A     | **Machine-covered 2026-08-28:** busy focus gating/restoration, reconnect recovery, and localized status state.        |
| `fluid-progress-bar`    | presentational |         18 | A     | **Machine-covered 2026-08-28:** malformed/nonfinite clamping, determinate transitions, and localized live state.      |
| `fluid-progress-ring`   | presentational |         16 | A     | **Machine-covered 2026-08-28:** malformed/nonfinite clamping, determinate API behavior, and forced colors.            |
| `fluid-skeleton`        | presentational |         14 | A     | **Machine-covered 2026-08-28:** busy semantics, reduced-motion suppression, and forced-colors visibility.             |
| `fluid-spinner`         | presentational |         15 | A     | **Machine-covered 2026-08-28:** live localized labels through reconnect, reduced motion, and forced colors.           |
| `fluid-stack`           | helper         |         10 | A     | **Machine-covered 2026-08-28:** dynamic children, invalid layout recovery, and narrow-content wrapping.               |

## Forms (19/19)

| Candidate                 | Class       | Unit cases | Depth       | Remaining critical-mode gap                                                                                                                |
| ------------------------- | ----------- | ---------: | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `fluid-button`            | interactive |         27 | A I E       | **Machine-covered 2026-08-28:** loading/disabled activation boundaries through reconnect and form-owner moves.                             |
| `fluid-button-group`      | helper      |         10 | A R         | **Machine-covered 2026-08-28:** dynamic/nested membership plus disabled-child composed focus and Tab order.                                |
| `fluid-checkbox`          | interactive |         19 | A I E R F S | **Machine-covered 2026-08-28:** mixed/required validity, reset defaults, fieldset ownership, and reconnect recovery.                       |
| `fluid-field`             | helper      |         11 | A           | **Machine-covered 2026-08-28:** live label/help/error/control replacement, stale-ownership cleanup, and reconnect.                         |
| `fluid-fieldset`          | helper      |         16 | A R         | **Machine-covered 2026-08-28:** live legend changes, authored disabled mutations, and nested/dynamic propagation.                          |
| `fluid-form`              | composite   |         19 | A I R       | **Machine-covered 2026-08-28:** queued-submit snapshots/cancellation, live reset controls, disconnect, and reconnect.                      |
| `fluid-input`             | interactive |         28 | A I E R F S | **Machine-covered 2026-08-28:** email/url/date type-error recovery plus form-owner and name reassociation.                                 |
| `fluid-number-input`      | interactive |         17 | A I R F S   | **Machine-covered 2026-08-28:** live min/max/step validity, malformed edits, nonpositive-step fallback, and recovery.                      |
| `fluid-option`            | interactive |         10 | A I R       | **Machine-covered 2026-08-28:** live insertion, disabled/value/label mutation, canonical selection, and typeahead; grouping is policy.     |
| `fluid-radio`             | interactive |         19 | A I R       | **Machine-covered 2026-08-28:** standalone misuse remains inert and outside Tab order through reconnect.                                   |
| `fluid-radio-group`       | composite   |         21 | A I R F     | **Machine-covered 2026-08-28:** required recovery after disabling selection, focus/FormData repair, inherited RTL arrows, and reconnect.   |
| `fluid-range-slider`      | interactive |         19 | A I R       | **Machine-covered 2026-08-28:** RTL numeric-arrow behavior plus interrupted-drag cleanup through reconnect.                                |
| `fluid-rating`            | interactive |         22 | A I R       | **Machine-covered 2026-08-28:** RTL half-star hit mapping and reconnect preview cleanup; `required` remains an API-policy decision.        |
| `fluid-segment`           | interactive |         16 | A I         | **Machine-covered 2026-08-28:** standalone misuse and selected-child removal remain inert through reconnect.                               |
| `fluid-segmented-control` | interactive |         16 | A I R       | **Machine-covered 2026-08-28:** enabled-item arrow/Home/End operation, inherited RTL ordering, removal, and reconnect.                     |
| `fluid-select`            | composite   |         30 | A I R F     | **Machine-covered 2026-08-28:** repeated-character typeahead, validity/form reassociation, and fieldset recovery; grouping remains policy. |
| `fluid-slider`            | interactive |         16 | A I R S     | **Machine-covered 2026-08-28:** live step snapping, RTL fill/keyboard semantics, detached edits, form reassociation, and reconnect.        |
| `fluid-switch`            | interactive |         18 | A I R F S   | **Machine-covered 2026-08-28:** custom validity and canonical FormData survive reconnect/form reassociation.                               |
| `fluid-textarea`          | interactive |         20 | A I R F S   | **Machine-covered 2026-08-28:** live length validity, resize modes/auto-resize, narrow reflow, detached edits, and form reassociation.     |

The 28 August tranche for rows 6–25 spans **19 focused test files** and passes
**338/338 in Chromium, 338/338 in Firefox, and 338/338 in WebKit** (**1,014
executions**) with clean supervised teardown. The lifecycle record is
`/workspace/quality/evidence/wtr-lifecycle/2026-08-28T12-29-40-498Z-98031.json`.
These machine results do not close Option grouping policy, manual AT, visual,
external-platform, or owner-approval requirements.

## Overlays and disclosures (16/16)

| Candidate             | Class       | Unit cases | Depth   | Remaining critical-mode gap                                                                                                                                                                                                    |
| --------------------- | ----------- | ---------: | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fluid-accordion`     | composite   |         19 | A I     | **Machine-covered 2026-08-28:** dynamic/open/disabled panels, single-mode reconciliation, and reconnect without synthetic events.                                                                                              |
| `fluid-banner`        | interactive |         19 | A I     | **Machine-covered 2026-08-28:** repeat dismiss/reinsert and stable live-root severity/content mutation; focus handoff remains manual.                                                                                          |
| `fluid-callout`       | interactive |         11 | A I     | **Machine-covered 2026-08-28:** caller-owned dismiss/reinsert and stable live-root severity/content/icon mutation.                                                                                                             |
| `fluid-details`       | interactive |         19 | A I R   | **Machine-covered 2026-08-28:** summary/body replacement, reconnect, and browser-real collapse focus continuity across Chromium, Firefox, and WebKit.                                                                           |
| `fluid-dialog`        | interactive |         15 | A I E R | **Machine-covered 2026-08-28:** nested modal focus restoration, disconnected show/reconnect, opener removal, and light-dismiss policy; manual modal AT remains.                                                                |
| `fluid-drawer`        | interactive |         12 | A I     | **Machine-covered 2026-08-28:** modal reconnect, opener removal, light-dismiss policy, logical RTL placement, and authored autofocus across all three engines. Nonmodal behavior remains an API-policy decision.              |
| `fluid-dropdown`      | composite   |         22 | A I R   | **Machine-covered 2026-08-28:** pending-open outside-close/focus cleanup, inside activation de-duplication, dynamic items, adoption, and reconnect.                                                                            |
| `fluid-dropdown-item` | interactive |         22 | A I R   | **Machine-covered 2026-08-28:** removal/disable and parent-adoption recovery; standalone misuse policy remains open.                                                                                                           |
| `fluid-menu`          | composite   |         24 | A I R   | **Machine-covered 2026-08-28:** repeated-character typeahead, nested pointer isolation, focused-item removal, label mutation, and reconnect.                                                                                   |
| `fluid-menu-item`     | interactive |         24 | A I R   | **Machine-covered 2026-08-28:** dynamic disable/removal and reconnect recovery; standalone activation semantics remain documented policy.                                                                                      |
| `fluid-menu-label`    | helper      |         21 | A       | **Machine-covered 2026-08-28:** inserted/hidden/removed labels preserve roving focus; accessible grouping remains an API-policy decision.                                                                                      |
| `fluid-popover`       | composite   |         15 | A I     | **Machine-covered 2026-08-28:** slotted focus entry, trigger removal/replacement, pending close, and open reconnect; manual AT remains open.                                                                                   |
| `fluid-popup`         | helper      |         12 | A       | **Machine-covered 2026-08-28:** anchor removal/replacement, collision and semantic RTL changes, live option restart, and open reconnect.                                                                                       |
| `fluid-toast`         | composite   |         26 | A I     | **Machine-covered 2026-08-28:** dynamic role/duration, hover/focus timer pause, disconnect/exit cleanup, and reconnect; queue overflow remains an API-policy decision.                                                         |
| `fluid-toast-item`    | interactive |         26 | A I     | **Machine-covered 2026-08-28:** timeout/dismiss/disconnect races and reconnect; action-focus policy and manual live-region AT remain open.                                                                                     |
| `fluid-tooltip`       | interactive |         16 | A I     | **Machine-covered 2026-08-28:** hover/focus/Escape races, authored-open override, trigger removal/replacement cleanup, and reconnect; touch/manual AT remains open.                                                            |

Rows 41–50 add **seven focused test files** and pass **133/133 in Chromium,
133/133 in Firefox, and 133/133 in WebKit** (**399 executions**) with clean
supervised teardown. The root-owned lifecycle record is
`/workspace/quality/evidence/wtr-lifecycle/2026-08-28T14-02-28-793Z-25698.json`.
Standalone-item semantics, Menu Label grouping, Toast queue/action policy,
manual AT/touch, visual, external-platform, and owner gates remain explicitly
open; they are not represented as machine failures or silently waived.

The two deferred real-browser interaction cases pass **6/6** in Playwright
across Chromium, Firefox, and WebKit after a fresh Storybook build: Details
returns focus to its disclosure after focused content collapses, and Drawer
honors an authored autofocus target consistently. No visual baseline was
updated. Drawer nonmodal behavior and manual AT remain explicit policy/manual
gates.

The 28 August tranche for rows 26–40 spans **13 focused test files** and passes
**275/275 in Chromium, 275/275 in Firefox, and 275/275 in WebKit** (**825
executions**) with clean supervised teardown. The lifecycle record is
`/workspace/quality/evidence/wtr-lifecycle/2026-08-28T13-29-59-792Z-16924.json`.
Of these 15 rows, Details alone retains a ledger-counted machine gap: real-browser
focus continuity when an open disclosure collapses. Rating `required`, Select
grouping, and Drawer nonmodal behavior remain explicit API-policy decisions;
Banner focus handoff, Drawer authored-autofocus cross-shadow behavior, manual AT,
visual, external-platform, and owner gates remain open and are not inferred from
this focused Web Test Runner matrix.

## Navigation (9/9)

| Candidate               | Class          | Unit cases | Depth   | Remaining critical-mode gap                                                                                                                                    |
| ----------------------- | -------------- | ---------: | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fluid-breadcrumb`      | presentational |         18 | A       | **Machine-covered 2026-08-28:** authored/automatic current transfer, hidden-last recovery, direct-child ownership, reflow, and RTL.                            |
| `fluid-breadcrumb-item` | interactive    |         18 | A I     | **Machine-covered 2026-08-28:** current/link transitions and dynamic removal; no documented disabled API exists, so disabled semantics remain an API decision. |
| `fluid-list`            | composite      |         19 | A I     | **Machine-covered 2026-08-28:** dynamic items, focused-disable withdrawal, semantic-mode transitions, and reconnect; the component owns no selection model.    |
| `fluid-list-item`       | interactive    |         19 | A I     | **Machine-covered 2026-08-28:** removal/disable during focus and live mode transitions; standalone `listitem` behavior remains its documented contract.        |
| `fluid-pagination`      | composite      |         20 | A I R   | **Machine-covered 2026-08-28:** non-finite totals/options, current mutation, RTL, narrow reflow, and form embedding.                                           |
| `fluid-tab`             | interactive    |         21 | A I E R | **Machine-covered 2026-08-28:** disabled/removed selection recovery, standalone neutralization, reorder, and reconnect.                                        |
| `fluid-tab-panel`       | helper         |         21 | A E R   | **Machine-covered 2026-08-28:** replacement/removal cleanup, authored tabindex removal, nested focus, reorder, and reconnect.                                  |
| `fluid-tabs`            | composite      |         21 | A I E R | **Machine-covered 2026-08-28:** disabled selection fallback, removal, complex dynamic reorder, and reconnect.                                                  |
| `fluid-toolbar`         | composite      |         18 | A I R   | **Machine-covered 2026-08-28:** all nested focusable descendants, dynamic/disabled/reconnect recovery, and inherited RTL.                                      |

Rows 51–59 add **five focused test files** and pass **103/103 in Chromium,
103/103 in Firefox, and 103/103 in WebKit** (**309 executions**) with clean
supervised teardown. The root-owned lifecycle record is
`/workspace/quality/evidence/wtr-lifecycle/2026-08-28T14-08-15-450Z-29590.json`.
The absent Breadcrumb Item disabled API and List selection/standalone policy are
kept explicit rather than manufacturing undocumented release behavior.

## Exact CERT-045 regression disposition

The three exact failures named by CERT-045 still have focused public-behavior
guards in
`packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.test.ts`:

1. backward native selection direction survives a canceled Link prompt and the
   next real `Shift+ArrowLeft` extends from the correct endpoint without changing
   HTML or emitting `fluid-change`;
2. sanitization that replaces editable DOM invalidates the saved range, retains
   sanitized HTML, and does not let the canceled Link command relocate selection;
3. read-only rollback that replaces editable DOM invalidates the saved range,
   restores the prior HTML, and remains event-silent.

These are causal assertions of observable selection, content, and event behavior;
they are not tests that merely inspect a private saved-range field. The existing
guards already cover the real gap, so this tranche does not add duplicate tests.

The fresh current-source editor suite passed **50/50 in Chromium, 50/50 in
Firefox, and 50/50 in WebKit** (150 executions), normal exit 0. Before execution,
host and Linux-container SHA-256 values matched for the editor runtime, test,
package manifest, and final root lockfile. The supervised lifecycle record is
`quality/evidence/wtr-lifecycle/2026-08-27T14-59-31-957Z-15397.json`; it reports
clean shutdown. The editor package TypeScript check also passed in the same
container. CERT-045's focused current-source requirement is therefore green,
but the defect remains under verification until the root's coordinated
current-tree integrated Linux gate passes.

## Honest remaining scope

- The ledger is complete as an inventory (**59/59 rows**) but not green as a
  certification ledger: 20 rows retain a machine-actionable gap, and every row
  still requires the applicable human/owner gates.
- `E` is representative (five components), not a 59-element environment matrix.
- `R` now includes the nine focused dynamic/recovery cohorts after the retained
  **765/765** all-engine run. The exact denominator, initial retained red,
  causal remediation, hash reconciliation, and green lifecycle evidence are in
  [the aggregate focused review](./stable-candidate-form-group-dynamic-recovery-2026-08-27.md).
  Rows still name their narrower remaining modes; `R` does not imply exhaustive
  certification.
- The full 642-case accessibility run establishes current automated serious/
  critical scanning and targeted browser checks; it does not establish manual
  NVDA, VoiceOver, Safari/macOS, mobile/touch, or human visual acceptance.
- Visual baseline approval, fluent-language review, and owner sign-off remain
  separate plan gates and are not inferred here.
