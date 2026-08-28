# Localization owned-string inventory, 27 August 2026

## Outcome

The current machine-guarded inventory is
`quality/localization-owned-strings.json`. It covers all 155 published custom
elements and records shared runtime surfaces that are not represented by a tag.
Its guard is `scripts/check-localization-owned-strings.mjs`, with causal negative
controls in `scripts/check-localization-owned-strings.test.mjs`.

This is a disposition inventory, not a count of English literals. Literal scans
cannot reliably distinguish user-facing internal copy from application content,
canonical values, browser chrome, dependency UI, CSS, event names, or developer
diagnostics. Accordingly, the inventory reports no localization-completeness
percentage.

## Ownership and disposition model

Each concrete surface has one of six ownership categories:

- internal Fluid copy;
- configurable Fluid defaults, where explicit caller overrides (including an
  intentional empty string) remain authoritative;
- application content that must be preserved verbatim;
- native/browser-owned UI;
- dependency-owned UI requiring an integration policy; or
- non-user text such as canonical form values and developer diagnostics.

The catalog layer is deliberately conservative. A registry signal does not mean
all strings are migrated; “no candidate confirmed” does not mean certification;
and a dated confirmed candidate stays assigned for follow-up until a bounded
surface record and evidence close it. The guard requires exact catalog coverage,
unique sorted assignments, every ownership category, existing source paths, and
retained evidence for completed claims. Negative tests prove that an omitted tag,
a missing source, a missing evidence reference, or a literal-count measurement
fails validation.

## Reconciliation with the dated audit

The inventory marks these later bounded slices as completed so they are not
implemented again:

- inherited formatter context for number, date, relative-time, and bytes;
- countdown and tour whole-message work;
- scheduler and time-slot messages; and
- parser-correct, request-isolated native-ancestor localization during SSR.

Later bounded work now closes binary long-unit grammar, locale-aware file-size
punctuation, meter descriptions, the core calendar RTL contract, media defaults,
and the parser structured-error boundary. Existing file-size unit semantics
remain an explicit compatibility boundary. Core date/time presets and picker
behavior, remaining expansion-package UI, localized parser UI, and dictionary
quality stay open.

## Current implementation sequence

The open records retain the recommended tranches without conflating ownership:

1. remaining core date/time presets and picker workflows building on the closed
   calendar RTL slice;
2. event-calendar/availability-editor, editor, kanban/node-graph, and
   table/chart/map/Markdown/QR groups;
3. localized parser UI messages building on the closed structured-error core;
4. boundary documentation and representative SSR/hydration/pseudo-locale tests.

Application-provided filenames, titles, labels, datasets, documents, custom
validator responses, and imported values are preservation contracts, not gaps.
Native validation/media/picker chrome and dependency UI are explicit policy and
evidence boundaries. ISO dates/times, form values, parsed/exported data, and event
payloads remain stable across language and direction changes.

## Remaining limitations and human gates

The catalog assignments originate from the comprehensive 26 August source audit
reconciled against the 27 August handoff. They prevent silent denominator drift,
but they do not prove every dynamic/error path has been exercised. Source-path
existence is not a runtime assertion. Each implementation tranche still needs
focused live-language, fallback, standalone-import, SSR/hydration, plural/date/
number, and RTL behavior tests as applicable.

Fluent-speaker review for Dutch, German, French, Spanish, and Arabic remains a
human gate. So do manual assistive-technology review and visual approval of real
Arabic RTL plus pseudo-locale overflow. Dictionary key parity cannot substitute
for any of those reviews.
