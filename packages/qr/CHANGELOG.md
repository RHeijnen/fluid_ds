# @fluid-ds/qr

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
