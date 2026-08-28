# Markdown and QR localization / RTL review (2026-08-27)

## Scope and ownership

This tranche localizes only Fluid-owned Markdown failure wrappers and QR-derived accessible names. Dutch, German, French, Spanish, and Arabic translations are drafts pending fluent review.

Markdown source, inline document text, source URLs, `marked` options, parsed output, DOMPurify behavior, trusted HTML, and raw browser/network/dependency error details remain application or dependency content. A failure detail is preserved verbatim as a typed argument to one complete translated message and rendered as text, not reparsed as HTML. Locale-only changes do not fetch, parse, sanitize, or emit `fluid-render` again.

QR `value`, error-correction inputs, matrix, module geometry, colors, logos, encoded bytes, PNG output, and download filenames remain canonical. The documented `label=""` behavior remains “derive a name”; a nonempty label remains authoritative. QR generation is cached by encoded value and effective correction level, so locale and direction changes update only the accessible name and direction without regenerating the matrix. Rasterization/module-resolution exceptions remain developer diagnostics and are not translation terms.

## Automated evidence

- Markdown browser suite: 12/12 passing in Chromium, Firefox, and WebKit
- QR browser suite: 22/22 passing in Chromium, Firefox, and WebKit
- Focused shared localization suite: 51/51 passing in Chromium, Firefox, and WebKit
- Components, Markdown, and QR typechecks: passing
- Markdown and QR builds and standalone Node imports: passing
- Arabic server render of both package definitions: passing
- Scoped ESLint and Prettier checks: passing
- Workspace dependency traversal: no cycle from Markdown or QR
- Exact workspace dependencies: both packages depend on `@fluid-ds/components: workspace:*`

Focused coverage includes all five derived-name locales, regional fallback, unusual argument text, empty-name derivation, explicit caller-label precedence, Arabic RTL, byte/element-identical module output across a live locale change, stable download names and data URLs, verbatim plain-text error detail, stable Markdown DOM, no refetch/reparse, and event silence.

## Remaining human and dependency boundaries

- Fluent-speaker review of the five draft translations, particularly Arabic QR terminology
- Visual RTL and pseudo-locale review for long URLs, error details, Markdown tables/code, and QR sizing
- Manual screen-reader review of derived QR names, explicit labels, empty QR output, and Markdown alerts in target browser/AT combinations
- Security/product review remains responsible for trusted Markdown mode and any policy that redacts raw network error details; this tranche preserves the current raw-detail policy without attempting to translate dependency text
