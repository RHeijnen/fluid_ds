# @fluid-ds/parser

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
