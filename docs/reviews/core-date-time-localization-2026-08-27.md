# Core date/time localization evidence, 27 August 2026

## Scope

This bounded slice covers Fluid-owned date-picker and date-range-picker prompts,
the six built-in range preset labels, inherited date display context, and
time-picker display labels. It does not translate application-provided labels,
help text, custom presets, date patterns, or canonical form/event values.

The implementation preserves an explicit formatter `locale`, including the
existing explicit-empty browser-default boundary. With no explicit locale,
date and time display follows the reactive inherited Fluid language context.
Explicit empty prompt overrides remain empty rather than falling back to a
dictionary term.

## Behavioral contracts

- Built-in range presets are localized only when the picker uses the exported
  built-in preset array. Custom preset labels, including an empty label, remain
  application-owned.
- Date values remain local date-only ISO `YYYY-MM-DD`; range form values remain
  `start/end`; time values remain canonical 24-hour `HH:MM`.
- `fluid-change` payloads and range matching continue to use canonical values.
- Time display uses `Intl.DateTimeFormat` with an explicit `h12` or `h23` hour
  cycle. This localizes digits and day periods without changing the configured
  12-hour/24-hour interaction contract.
- Arabic RTL coverage verifies localized display and chronological option
  order. Direction does not reverse time progression or canonical values.
- Dutch, German, French, Spanish, and Arabic dictionary additions are drafts
  pending fluent review.

## Verification

The first all-engine focused run retained a causal red checkpoint: Firefox
exposed an invalid inherited browser locale and the new time test initially
filtered the list to its selected label. Both were corrected without weakening
the assertions.

The synchronized Linux source then passed:

- 68 focused tests in Chromium;
- 68 focused tests in Firefox;
- 68 focused tests in WebKit;
- 204 total executions with normal lifecycle shutdown, retained at
  `quality/evidence/wtr-lifecycle/2026-08-27T11-10-45-535Z-16152.json`;
- the components source typecheck;
- all 143 browser-test file typechecks across 14 packages;
- scoped ESLint for the three components, their tests, localization registry,
  and five official locale files;
- `git diff --check`.

These automated results do not replace fluent-language review, visual Arabic
RTL/pseudo-locale review, or manual assistive-technology review.
