# Core calendar RTL contract, 27 August 2026

## Outcome

The core calendar now follows inherited Fluid language and writing direction
reactively while keeping its explicit `locale` and `dir` controls independent.
Arabic and numbering-system extensions affect month, weekday and day-number
display without changing canonical ISO values.

RTL horizontal arrow navigation follows the rendered timeline. Previous/next
glyphs mirror while their month deltas remain previous and next respectively,
and range endpoint caps use logical CSS edges. Keyboard activation after Arabic
RTL navigation continues to emit the canonical `YYYY-MM-DD` value.

Omitted `locale` inherits Fluid language context. Explicit `locale=""` retains
the historical browser-default formatting boundary instead of silently adopting
an ancestor language. Invalid explicit locales use a safe browser fallback so
Firefox does not throw from `Intl`. Direction continues to follow explicit
`dir` or inherited direction independently of display locale.

## Verification and remaining scope

The focused suite passes 19/19 tests in Chromium, Firefox and WebKit with normal
lifecycle shutdown. Component typecheck, scoped ESLint, Prettier and
`git diff --check` pass.

This closes the core-calendar RTL slice only. Built-in date presets,
date-picker/date-range prompts, time-picker display, broader picker workflows,
visual RTL approval and fluent Arabic review remain open.
