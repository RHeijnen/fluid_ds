---
"@fluid-ds/editor": patch
"@fluid-ds/map": patch
"@fluid-ds/kanban": patch
---

Fix three expansion-pack visual bugs (all verified in the browser):

- **editor**: the toolbar icons were invisible. The inline SVG path fragments
  were built with Lit's `html` tag, which creates them in the HTML namespace, so
  they did not render as SVG geometry inside `<svg>`. They now use the `svg`
  tag, so the path data is SVG-namespaced and the buttons show their icons.
- **map**: marker icons rendered as broken images. Leaflet's `Icon.Default`
  prepends a (mis)detected `imagePath` to its PNG URLs under the bundled ESM
  build, even when an absolute override is given. The component now uses one
  explicit `L.icon` with absolute CDN URLs (a plain icon uses its URLs verbatim),
  so markers and their shadows load correctly.
- **kanban**: the drag drop-target highlight displayed incorrectly. It used an
  `outline` with `outline-offset`, which the `overflow: auto` board scroll
  container clips. It now uses an inset box-shadow ring plus a faint accent tint,
  painted inside the column box so it is never clipped.
