# Parser structured-error contract, 27 August 2026

## Outcome

The headless parser now exposes stable machine-readable diagnostics for every
built-in coercion and validation family without requiring a UI to parse English
sentences. Existing `message` values remain present and unchanged. Caller
validator strings remain application-owned and are returned verbatim.

Parser-produced `CellError.diagnostic` contains a discriminated `code` and its
code-specific typed `parameters`. The property remains optional in the public
interface so existing callers that construct `CellError` objects keep source
compatibility. The public type mapping covers required values, string
length and pattern checks, number/integer/range failures, booleans, dates,
email, URL, enumeration, JSON, unmapped required fields, transform failures and
custom validation. Raw values and unusual field labels remain parameters rather
than being recovered from display prose.

JSON file failures now use `ParserFileError`, an `Error` subclass that retains
the existing message while exposing `invalidJsonSyntax` or `invalidJsonShape`
with typed parameters. The headless parser remains independent of DOM or global
locale state.

## Compatibility boundaries

- `CellError.message` and thrown file-error messages remain the compatibility
  display fallback.
- Canonical parsed rows, mappings, statistics and exported values are unchanged.
- Custom validator messages are not translated or rewritten.
- Transform exception detail is retained as a parameter; a future localized UI
  must decide whether and how that developer/application detail is displayed.
- This slice establishes the structured boundary. It does not yet localize the
  file-parser or column-mapper UI, nor does it change coercion according to UI
  locale.

## Verification

The parser package typecheck passes. Its complete eight-file browser suite
passes 110 tests per engine in Chromium, Firefox and WebKit, with normal
lifecycle shutdown. Tests cover every built-in diagnostic family, unusual
labels/raw values, unmapped required fields, transform errors, caller-owned
custom validation text, non-`Error` transform throws and both structured JSON
file-error codes.

This is bounded engineering evidence, not dictionary completeness,
fluent-speaker approval or parser UI localization completion.
