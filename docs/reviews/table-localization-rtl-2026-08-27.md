# Table localization/RTL review — 2026-08-27

## Scope and outcome

This focused tranche integrates both `fluid-table` and `fluid-infinite-table` with the shared typed localization controller. English and draft Dutch, German, French, Spanish and Arabic terms cover Fluid-owned selection controls, resize/reorder controls, column settings, complete result counts, loading/empty/end states and column-position announcements.

`@fluid-ds/table` now depends directly on `@fluid-ds/components: workspace:*`; the lockfile contains the matching table importer entry. Components does not depend on table, so the dependency remains acyclic. Generated custom-element manifests were not changed.

## Preserved contracts

- Simple-table select-all and indexed row names use localized display numbers. Captions, column labels, row identifiers and cell values remain application data.
- Infinite-table resize, reorder and position properties retain their existing template API. Custom values and intentional empty strings remain authoritative; only an unset default follows the live localization context.
- Column-position announcements are stored semantically, so an active keyboard pickup relocalizes without changing layout, focus or emitting `fluid-column-layout-change`.
- Result counts use complete typed messages and locale-aware numbers/plurals. The built-in empty state and loading/scroll/end sentinels localize live. Assigned empty/error slots and the application `error` property retain precedence and content unchanged.
- Caption, column, row and rich cell-renderer output remains verbatim. Locale changes do not sort, filter, select, page, load, activate rows or emit business events.
- Canonical row keys, sort objects, row/column references, layout keys/order/widths and emitted payloads remain unchanged.
- Arabic direction is applied to table surfaces, settings and live regions. Existing direction-aware resize and reorder behavior remains logical: Arabic Left moves a picked-up column forward in rendered order and widens a keyboard-resized column, without translating persisted layout keys or widths.
- Virtual windowing, scroll observation, infinite-load triggering and application renderers remain unchanged. These components have no built-in numbered paginator; the owned infinite-loading/status surfaces are localized without inventing a new pagination policy.

## Verification

Linux container verification passed:

- `@fluid-ds/components` and `@fluid-ds/table` package typechecks.
- Repository browser-test typecheck: 143 files across 14 packages, zero diagnostics; typed localization contract tests: 5/5.
- Scoped ESLint across both table runtimes/tests and the shared contract/locales.
- Full table package suite with `FLUID_BROWSERS=all`: 50/50 in Chromium, 50/50 in Firefox and 50/50 in WebKit (150 executions). Lifecycle: `quality/evidence/wtr-lifecycle/2026-08-27T12-22-48-582Z-46374.json`.
- Table package build and standalone built imports for `fluid-table` and `fluid-infinite-table`.
- Dependency-cycle review, exact manifest/lock review, Prettier on owned package files and `git diff --check`.

## Remaining human/platform boundaries

- All five translated dictionaries are functional drafts pending fluent-speaker review.
- Native checkbox chrome, scrollbar presentation and browser table semantics remain user-agent-owned.
- Final target assistive-technology review should cover Arabic selection names, long result summaries, settings dialog names and live column-position changes.
- Final visual review should cover translated toolbar/settings text, Arabic result states, empty/error slots and narrow virtualized tables. Application cell renderers and their internal direction remain application-owned.
