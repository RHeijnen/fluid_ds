# Core units, file-size and meter localization, 27 August 2026

## Outcome

The bounded core tranche now localizes binary long-unit grammar, file-size
number punctuation and meter value descriptions. Runtime changes preserve
canonical values and application-owned content.

- Binary `display="long"` output uses typed unit arguments and locale plural
  rules instead of an always-plural English suffix. English singular output is
  corrected, French fractional categories and Arabic one/two/few/other paths
  have focused coverage, and live inherited-language changes retain the numeric
  value, base and display mode.
- File-input and dropzone format file-size numerals through the live inherited
  locale while preserving filenames verbatim.
- Meter default numerals and complete value/band descriptions are localized.
  Caller `valueFormatter` strings remain untouched while the surrounding
  library-owned sentence changes language. `aria-valuenow` and
  `aria-valuemax` remain canonical numeric strings.

## Compatibility boundary

This tranche deliberately does not reinterpret existing file-size semantics.
File-input and dropzone retain their current 1024 thresholds and existing
`B`/`kB`/`KB`/`MB`/`GB`/`TB` symbols. Changing that public presentation requires
an explicit compatibility decision; it was not folded into localization work.
Standard symbols are distinct from translated long-unit prose.

Official Dutch, German, French, Spanish and Arabic strings remain drafts until
fluent speakers approve terminology and grammar.

## Verification

The four focused component files pass 127 tests per engine in Chromium, Firefox
and WebKit: 381 executions with normal lifecycle shutdown. The later complete
components suite passes 1,840 tests per engine (5,520 executions). Full workspace
typecheck and lint, localization typing guards and `git diff --check` pass on the
synchronized Linux snapshot.

This evidence closes the bounded localization contract, not fluent-language,
assistive-technology, visual RTL or release approval.
