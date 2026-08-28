# @fluid-ds/icons

## 0.4.0

### Minor Changes

- Add dedicated `registry`, `load-icon`, and `manifest` entry points. Consumers
  can lazy-load an icon from the bundled Lucide catalog without making
  registry-only imports traverse the generated icon-loader graph.

### Patch Changes

- Keep the curated default registration and per-icon side-effect imports
  available while separating the complete icon-name manifest for tooling and
  icon-picker use cases.

## 0.0.3

### Patch Changes

- Promote the foundational icon, theme, and token packages from the alpha
  prerelease line alongside the first stable component and expansion releases.
