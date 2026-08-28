# @fluid-ds/qr

## 0.4.0

### Patch Changes

- Derived QR accessible names now follow the active Fluid locale and text direction while
  preserving explicit labels and encoded content. QR matrices are reused when only locale or
  direction changes, and server rendering no longer depends on browser-only style APIs.
- Add package metadata and an exported custom-elements manifest for editor and integration
  tooling.

## 0.1.0

### Minor Changes

- 0aace0d: `<fluid-qr-code>` can now produce fancy, logo-embedded QR codes. New: a center
  logo overlay (`logo`, `logo-size`, `logo-padding`, `logo-background`,
  `logo-radius`) that knocks out a quiet area and auto-raises error correction to
  `H` so it still scans; module styling via `module-shape` (`square` / `dots` /
  `rounded`) and an optional linear `gradient`; finder-eye styling (`eye-shape`,
  `eye-color`, plus per-corner overrides) drawn as dedicated parts; an opt-in
  `artistic` mode that paints the image full-bleed behind semi-opaque dot modules
  (with a documented scannability caveat); and raster export via `toDataURL()` /
  `download()`. Every painted role reads a `--fluid-qr-*` token.
