# Rainbow pack localization review (2026-09-26)

Scope: `@fluid-ds/rainbow` 1.0 line, `fluid-rainbow-battery`, `fluid-rainbow-clock`
and `fluid-rainbow-landscape`, current source.

- **fluid-rainbow-battery**: the only Fluid-owned string is the fallback
  accessible name, which reuses the shared registry term `meter` (already
  translated in every shipped locale). The value text is an
  `Intl.NumberFormat` percentage in the element's resolved locale; a focused
  test pins Dutch formatting (`99,5%`). The label itself is application
  content (slot or `label`).
- **fluid-rainbow-clock**: no Fluid-owned text. Time and date are produced
  by `Intl.DateTimeFormat` in the resolved locale; a focused test pins the Dutch
  weekday. The hour cycle follows the locale unless the application forces it.
- **fluid-rainbow-landscape**: no Fluid-owned text. The artwork is decorative;
  the optional `label` and all slotted content are application content.

Bounded review of owned strings only; this is not fluent-language, visual RTL
or manual assistive-technology certification.
