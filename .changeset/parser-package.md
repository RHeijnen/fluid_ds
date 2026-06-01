---
"@fluid-ds/parser": minor
---

New `@fluid-ds/parser` expansion pack: drag a JSON / CSV / TSV / Excel file onto
a Fluid file-drop and parse it against a declarative blueprint. A zero-UI core
(`@fluid-ds/parser/core`) does `parseFile` (own RFC-4180 CSV parser with
delimiter + header sniffing; XLSX via SheetJS lazily imported only when an
`.xlsx` is dropped) and `applyBlueprint` (fuzzy column auto-mapping, per-type
coercion + validation with per-cell errors, dedupe, row caps). The
`<fluid-file-parser>` component wires a `fluid-dropzone`, an auto-mapping step,
a validated error-highlighted preview, and CSV / JSON export, emitting
`fluid-file-loaded`, `fluid-parse`, and `fluid-parse-error`. A standalone
`<fluid-column-mapper>` exposes the source-to-field mapping UI.
