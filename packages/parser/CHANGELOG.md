# @fluid-ds/parser

## 1.0.0-rc.0

### Minor Changes

- 4139c57: Add the Rainbow brand preset and the tokens it needs.
  - New `@fluid-ds/themes/rainbow.css`: playful pastels on cream paper, 3px ink
    outlines, squircle corners, solid offset "pop" shadows and a rounded display
    font, verified at AA and AAA in light and dark.
  - New tokens: `--fluid-border-width-default` and `--fluid-border-width-divider`
    (every literal 1px outline and divider in the catalog now reads them through a
    per-component knob such as `--fluid-card-border-width`),
    `--fluid-font-family-display`, `--fluid-easing-spring`, and the optional
    `--fluid-accent-fg` / `--fluid-<tone>-fg` roles for themes whose accent fill is
    too light to use as text.
  - New component knobs: button outline width, resting / pressed / toggled
    shadows and press depth; switch track and thumb size, outline and shadows;
    badge outline; card radius and header font; dialog outline and title font;
    input shadow. New `fluid-pop-in` keyframe.
  - New expansion pack `@fluid-ds/rainbow`: `<fluid-rainbow-landscape>`,
    `<fluid-rainbow-clock>` and `<fluid-rainbow-battery>` widgets plus fourteen
    illustrated app icons for the shared icon registry, with React wrappers.

  Every new token defaults to the previous value, so existing brands render
  unchanged.

### Patch Changes

- Updated dependencies [4139c57]
  - @fluid-ds/components@1.0.0-rc.0
  - @fluid-ds/icons@1.0.0-rc.0

## 0.4.0

### Minor Changes

- Add optional, typed `diagnostic` codes and parameters to parser-produced cell
  errors, plus `ParserFileError` codes for invalid JSON syntax and shape. Existing
  display messages remain available for compatibility.

### Patch Changes

- Localize the column-mapper and file-parser presentation, including structured
  diagnostics, counts and RTL direction, while preserving caller labels, custom
  validator messages, parsed values and event payloads.
- Ignore stale or disconnected asynchronous file reads so an earlier request
  cannot overwrite newer parser state.

## 0.1.6

### Patch Changes

- Updated dependencies
  - @fluid-ds/components@0.1.6

## 0.1.5

### Patch Changes

- Updated dependencies
  - @fluid-ds/components@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies
  - @fluid-ds/components@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies [81660d1]
- Updated dependencies [68ed464]
- Updated dependencies [2ff7a1e]
- Updated dependencies [b799cb8]
- Updated dependencies [9836631]
  - @fluid-ds/components@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [b134248]
  - @fluid-ds/components@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @fluid-ds/icons@0.0.3
  - @fluid-ds/components@0.1.1

## 0.1.0

### Minor Changes

- 0aace0d: New `@fluid-ds/parser` expansion pack: drag a JSON / CSV / TSV / Excel file onto
  a Fluid file-drop and parse it against a declarative blueprint. A zero-UI core
  (`@fluid-ds/parser/core`) does `parseFile` (own RFC-4180 CSV parser with
  delimiter + header sniffing; XLSX via SheetJS lazily imported only when an
  `.xlsx` is dropped) and `applyBlueprint` (fuzzy column auto-mapping, per-type
  coercion + validation with per-cell errors, dedupe, row caps). The
  `<fluid-file-parser>` component wires a `fluid-dropzone`, an auto-mapping step,
  a validated error-highlighted preview, and CSV / JSON export, emitting
  `fluid-file-loaded`, `fluid-parse`, and `fluid-parse-error`. A standalone
  `<fluid-column-mapper>` exposes the source-to-field mapping UI.

### Patch Changes

- Updated dependencies [db0556c]
- Updated dependencies [db0556c]
- Updated dependencies [db0556c]
- Updated dependencies [db0556c]
- Updated dependencies [db0556c]
  - @fluid-ds/components@0.1.0
