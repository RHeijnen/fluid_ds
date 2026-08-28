# Charts and map localization / RTL review (2026-08-27)

## Scope reviewed

- `fluid-chart` and the bar, bubble, doughnut, line, pie, polar-area, radar, and scatter wrappers
- `fluid-map`, including wrapper and marker fallback names
- Dutch, German, French, Spanish, and Arabic draft translations

## Ownership boundary

Fluid owns the default chart and map accessible names, the doughnut center `Total` label and number display, and fallback names for otherwise unnamed HTML legend items and map markers. Caller datasets, labels, options, formatters, coordinates, markers, popup text, tile URLs, and attribution remain unchanged.

Chart.js continues to own canvas drawing and legend semantics. A locale-only change performs one in-place canvas draw when a doughnut center total must visibly change; it does not recreate the chart, call `update`, mutate data, reset visibility, or emit `fluid-legend-change`. Other chart wrappers only rerender Fluid-owned DOM names.

Leaflet continues to own zoom-control titles, attribution mechanics, tiles, keyboard panning, coordinates, and its other dependency UI. Locale-only changes retag only omitted Fluid marker names and the map region; they do not recreate the map or markers, refetch tiles, move the view, or emit public events. Explicit empty and caller-provided names remain authoritative.

## Automated evidence

- Charts browser suite: 43/43 passing in Chromium, Firefox, and WebKit
- Map browser suite: 25/25 passing in Chromium, Firefox, and WebKit
- Focused shared localization suite: 51/51 passing in Chromium, Firefox, and WebKit
- Components, charts, and map typechecks: passing
- Charts and map builds and standalone Node imports: passing
- Scoped ESLint: passing
- Workspace dependency traversal: no cycle from charts or map
- Exact workspace dependencies: both packages depend on `@fluid-ds/components: workspace:*`

The focused tests cover live Arabic and regional-locale switching, RTL direction, Arabic and regional number display, explicit custom and empty overrides, stable caller data and labels, stable chart visibility, stable Leaflet instances/markers/tiles/attribution, event silence, physical ArrowRight eastward panning in RTL, and the explicit third-party string boundary.

## Human gates still required

- Fluent-speaker review of all five draft locales, especially concise Arabic chart terminology
- Visual RTL review of HTML legends, doughnut center typography, Leaflet controls, popups, and marker placement with production CSS and real tiles
- Manual screen-reader review of canvas fallback content, legend toggles, map-region navigation, markers, popups, and Leaflet dependency controls
- Product review of whether applications should opt into localized Chart.js/Leaflet dependency UI through their own configuration; this tranche intentionally does not patch third-party source
