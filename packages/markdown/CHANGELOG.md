# @fluid-ds/markdown

## 0.4.0

### Patch Changes

- Replace the built-in sanitizer with DOMPurify while retaining the explicit
  `trusted` opt-out for known-safe Markdown.
- Render localized, direction-aware remote-load failures as alerts without
  inserting diagnostic text as HTML.

## 0.1.0

### Minor Changes

- Improve the chart expansion pack's theme-token coverage and add Storybook
  examples for scatter, bubble, radar, and polar-area charts.

  Harden `fluid-markdown` by sanitizing rendered HTML by default, add an explicit
  `trusted` escape hatch for known-safe content, align link styling with the
  semantic accent token, and add Storybook and browser-test coverage.
