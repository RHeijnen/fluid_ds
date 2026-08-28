# Parser presentation localization / RTL review (2026-08-27)

## Scope and ownership

This tranche localizes the Fluid-owned presentation layer of `fluid-column-mapper` and `fluid-file-parser`. It consumes the parser core's structured diagnostic codes and typed parameters without changing parsing, coercion, validation, mapping, export, or file-format behavior. Dutch, German, French, Spanish, and Arabic translations are drafts pending fluent review.

Field labels and keys, source-column names, filenames, raw cell values, enum options, transform reasons, and explicit dropzone labels remain caller content. Explicit `label=""` remains empty. Custom-validator messages and legacy `CellError` values without a structured diagnostic remain verbatim compatibility content. The two structured `ParserFileError` families receive localized display text while the existing English `fluid-parse-error` event message remains unchanged for compatibility.

Counts and row indices use the effective locale's number formatting, and complete messages own plural grammar. A locale-only change rerenders inherited language and direction without rereading the file, applying the blueprint again, mutating rows or mappings, or emitting file, parse, or mapping events. Canonical accept tokens, CSV/JSON format identifiers, exported rows, MIME types, download filenames, and event payloads are unchanged.

The mapper continues to use the browser's native `<select>` semantics. Localization changes only its Fluid-owned prompt options and required marker title; platform picker chrome, keyboard interaction, and option application content remain native/browser or caller boundaries.

## Automated evidence

- Full parser browser suite: 119/119 passing in Chromium, Firefox, and WebKit
- Parser and components typechecks: passing
- Parser production build: passing
- Parser core and root standalone Node imports: passing
- Scoped ESLint and Prettier checks: passing
- `git diff --check`: passing
- Workspace dependency traversal from `@fluid-ds/parser`: acyclic through components, icons, and tokens
- Exact dependency state: the parser package and lock importer already contained `@fluid-ds/components: workspace:*`; no manifest or lockfile edit was required in this tranche

Focused coverage includes live Arabic RTL to `fr-CA` regional fallback, native-select boundaries, stable application labels and source columns, explicit and intentionally empty dropzone labels, both structured file-error codes, parser-owned empty-message fallback, every structured cell-diagnostic family, custom and legacy compatibility messages, unusual interpolation arguments, Arabic numerals and plural summaries, duplicate/truncated/error/preview/action text, stable result and row identities, one file read across locale changes, and business-event silence.

## Remaining human and dependency boundaries

- Fluent-speaker review of all five translation drafts, especially Arabic plural forms and parser terminology
- Visual RTL and pseudo-locale review for long filenames, field names, source columns, raw values, enum lists, error details, and horizontally scrolling preview tables
- Manual screen-reader review of localized callout announcements, invalid-cell titles, the required marker, and native select prompts across supported browser/AT combinations
- Native file-picker, native select-popup chrome, spreadsheet-engine diagnostics, and browser-generated JSON syntax reasons remain dependency/platform text and are intentionally not translated here
