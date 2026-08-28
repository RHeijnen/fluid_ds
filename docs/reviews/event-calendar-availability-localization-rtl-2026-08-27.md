# Event calendar and availability editor localization/RTL review — 2026-08-27

## Scope

This focused review covers the remaining Fluid-owned localization and RTL behavior in:

- `@fluid-ds/calendar` event calendar
- `@fluid-ds/scheduler` availability editor
- the shared typed localization contract and the Dutch, German, French, Spanish, and Arabic draft locale registrations

It does not change scheduler or time-slots behavior. Locale text is a functional draft pending fluent-speaker review.

## Implemented behavior

- Event-calendar navigation, event-count announcements, overflow actions, dates, weekdays, month names, and visible numbers use the inherited localization context live.
- Availability-editor headings, settings labels, weekday controls, time-window accessible names and validation, closed-date controls, weekdays, and visible ordinals use the same typed context.
- An explicit `locale` controls `Intl` display independently from the inherited message language. An omitted locale follows the nearest live `lang`; an explicit empty value preserves browser-default `Intl` behavior; malformed inherited locales safely fall back to English display formatting.
- Regional fallback is covered with `fr-CA` resolving the registered French messages while retaining `fr-CA` for `Intl` formatting.
- RTL direction is applied at each component base. Event-calendar navigation icons mirror and horizontal grid/event-chip keyboard movement follows the visual Arabic direction; vertical movement and chronological month navigation remain physical/logical respectively.
- Application-provided event identifiers, titles, colors, canonical `YYYY-MM-DD` day payloads, canonical `HH:mm` input values, and emitted availability structures remain unchanged.
- The composed closed-date picker receives explicit locale state while still inheriting live context when the availability editor locale is omitted.

## Verification

Linux container verification passed:

- `@fluid-ds/components`, `@fluid-ds/calendar`, and `@fluid-ds/scheduler` package typechecks.
- Repository browser-test typecheck: 143 files across 14 packages, zero diagnostics; localization contract tests: 5/5.
- Scoped ESLint across all changed source, tests, localization contract, and locale files.
- Calendar full browser suite with `FLUID_BROWSERS=all`: 21/21 in Chromium, 21/21 in Firefox, 21/21 in WebKit (63 total). Lifecycle: `quality/evidence/wtr-lifecycle/2026-08-27T11-56-38-643Z-37094.json`.
- Scheduler full browser suite with `FLUID_BROWSERS=all`: 67/67 in Chromium, 67/67 in Firefox, 67/67 in WebKit (201 total), including scheduler and time-slots regression coverage. Lifecycle: `quality/evidence/wtr-lifecycle/2026-08-27T11-53-26-498Z-34796.json`.
- Calendar and scheduler package builds.
- Standalone built definition imports registered `fluid-event-calendar` and `fluid-availability-editor` without an aggregate package import.
- `git diff --check`.

The final tests cover live `ar` to `fr-CA` switching, explicit-versus-inherited locale behavior, localized plural/count output, application-content preservation, real browser RTL geometry, focus/keyboard paths, mirrored controls, stable ISO day events, stable canonical time values, and unchanged availability payloads.

## Remaining human and platform boundaries

- Dutch, German, French, Spanish, and Arabic translations require fluent-speaker review before they are described as production copy.
- Native `input[type="time"]` and its operating-system/browser chrome remain user-agent-owned. The component localizes its labels and preserves canonical values but cannot replace native chrome text or layout.
- Final assistive-technology review should include Arabic announcements for full day/event-count labels and availability time-window labels in target screen reader/browser pairs.
- Final visual review should include narrow layouts, long translated weekday/setting labels, Arabic overflow controls, focus rings, and platform-native time controls.
