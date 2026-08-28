# Scheduler native form, SSR and localization contract, 27 August 2026

## Outcome

Scheduler now has explicit client-rendered and declarative-shadow-DOM form
contracts across Chromium, Firefox and WebKit. Required native form-focus
coverage advances from 15/16 to **16/16**.

The correction target follows scheduler state: before a day is chosen, native
validation focuses the calendar's active day; after a day is chosen it focuses
the first available time slot; if a previously selected slot becomes booked, it
focuses that selected slot. Disabled, readonly and loading states remain inert.

## Reproduced failures and repairs

- Required and unavailable values had no native validation anchor. Scheduler,
  calendar and time-slots now expose deliberate delegated/public focus behavior,
  and scheduler anchors validity to the actual nested day or slot button.
- `fluid-change` fired before the committed appointment reached
  `ElementInternals`. Event observers now see canonical FormData synchronously.
- Browser form-state restoration was absent. Canonical local ISO appointment
  values now restore the selected date, visible month and form value together.
- Scheduler and time-slots bypassed the locale registry for validation, prompts,
  loading, group names, empty states, unavailable labels and live counts. Ten
  typed terms now ship in English, Dutch, German, French, Spanish and Arabic.
- Linux Firefox keeps native validation UI active after focusing the nested day;
  its first pointer click dismisses that UI without activating the date. The
  cross-engine contract follows the focused correction target with Escape,
  ArrowRight and Enter, proving the keyboard flow without weakening assertions.

## Passing evidence

- Focused Playwright: 18/18 across three engines and both client/DSD modes.
  Coverage includes native and Fluid submitters by pointer and keyboard, dynamic
  day/slot/unavailable focus, live Dutch validation, custom errors, actual day
  and slot selection, synchronous events/FormData, reset, restored state,
  disabled/readonly/loading guards, externally booked values, reconnect and
  original server calendar/shadow-root identity.
- Scheduler package: 62/62 per engine, 186 executions total, with normal
  lifecycle-supervisor shutdown.
- Focused core calendar regressions: 12/12 per engine, 36 executions total.
- Central localization controller: 50/50 per engine, 150 executions total.
- Exact synchronized pinned-Linux SSR/hydration gate: 204/204 in 5.0 minutes,
  normal exit, after regenerating the 155-element catalog and 32 isolated form
  fixtures. No warning allowance was added.
- Coordinated pinned-Linux `FLUID_BROWSERS=all pnpm verify`: 6,942 unit
  executions across all 42 package/engine runs, 18 package builds, 1,903 cold
  imports, 155 server renders, a 136-page documentation build and 24,224 local
  links, normal exit in 605 seconds. The retained preflight failures found and
  repaired narrow restore signatures, explicit `any` casts, stale quality
  attribution and stale canonical manifests before this final run.

## Limits

Sixteen of sixteen means the scoped required native-focus inventory is complete;
it does not mean every component behavior is certified. This slice does not
certify real booking-network races, every daylight-saving transition, arbitrary
availability mutation, pre-registration scheduler state adoption, history
navigation, visual themes, fluent translation quality or manual assistive-
technology behavior. The coordinated full-workspace checkpoint is complete;
the broader SSR-state, localization/RTL, visual, performance and release
sections remain.
