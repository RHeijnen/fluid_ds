# @fluid-ds/charts

## 0.4.0

### Minor Changes

- Add a keyboard-operable HTML legend that reflects Chart.js visibility and
  emits `fluid-legend-change` after a legend item is activated. Canvas fallback
  text and Fluid-owned chart, legend, and doughnut-total labels now follow the
  inherited localization context without changing caller datasets or options.

### Patch Changes

- Apply inherited text direction to Fluid-owned chart surfaces and format
  generated numbers with the active locale. Locale-only updates preserve chart
  instances, dataset visibility, and caller-provided labels.

- Publish the generated custom-elements manifest and make package entry points
  importable in Node-based tooling.

## 0.0.3

### Patch Changes

- Improve the chart expansion pack's theme-token coverage and add Storybook
  examples for scatter, bubble, radar, and polar-area charts.

  Harden `fluid-markdown` by sanitizing rendered HTML by default, add an explicit
  `trusted` escape hatch for known-safe content, align link styling with the
  semantic accent token, and add Storybook and browser-test coverage.
