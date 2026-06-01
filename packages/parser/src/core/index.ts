/**
 * Headless parser core: zero UI, zero DOM, fully unit-testable. Import from
 * `@fluid-ds/parser/core` to use the engine on its own (including server-side).
 */
export type {
  RawTable,
  FileFormat,
  FieldType,
  FieldSpec,
  Blueprint,
  CellError,
  ParseStats,
  ParseResult,
  ApplyOptions
} from "./types.js";

export { parseFile, detectFormat, parseJson, gridToTable, type ParseFileOptions } from "./parse-file.js";
export { parseDelimited, sniffDelimiter, type Delimiter } from "./csv.js";
export { autoMap, normalize } from "./mapping.js";
export { coerceCell, isEmpty, type CoerceResult } from "./coerce.js";
export { applyBlueprint } from "./apply-blueprint.js";
export { toCSV, toJSON } from "./export.js";
