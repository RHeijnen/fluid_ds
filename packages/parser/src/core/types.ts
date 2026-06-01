/**
 * Public types for the headless parser core.
 *
 * Nothing here touches the DOM: the whole core is a set of pure functions over
 * plain data so it can be unit-tested and run server-side.
 */

/** A raw, untyped table as read from a file (every cell is still unknown). */
export interface RawTable {
  /** Column headers in source order. */
  columns: string[];
  /** Rows keyed by column header. */
  rows: Record<string, unknown>[];
}

/** The data formats {@link parseFile} understands. */
export type FileFormat = "json" | "csv" | "tsv" | "xlsx";

/** A field's value type. Drives coercion + validation. */
export type FieldType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "email"
  | "url"
  | "enum"
  | "json"
  | "custom";

/**
 * One target field in a {@link Blueprint}. The cleaned output object has one
 * property per field, keyed by {@link FieldSpec.key}.
 */
export interface FieldSpec {
  /** Output property name. */
  key: string;
  /** Human label (used in the mapping UI + error messages). Defaults to `key`. */
  label?: string;
  /** Value type. */
  type: FieldType;
  /** A missing / empty value is an error when true. */
  required?: boolean;
  /**
   * Alternate source-column names that should auto-map to this field
   * (case-insensitive, punctuation-insensitive).
   */
  aliases?: string[];
  /** Numeric / date lower bound (inclusive). For numbers, dates, and string length. */
  min?: number;
  /** Numeric / date upper bound (inclusive). For numbers, dates, and string length. */
  max?: number;
  /** Allowed values for `type: "enum"`. */
  options?: readonly (string | number)[];
  /**
   * Date parse hint for `type: "date"`. `"iso"` (default) accepts ISO-8601;
   * `"us"` accepts M/D/Y; `"eu"` accepts D/M/Y. Output is always an ISO date
   * string (`YYYY-MM-DD`) or full ISO timestamp when a time is present.
   */
  format?: "iso" | "us" | "eu";
  /** Strings (lower-cased) that coerce to `true` for `type: "boolean"`. */
  truthy?: readonly string[];
  /** Regex the (string) value must match. String form is compiled case-sensitively. */
  pattern?: RegExp | string;
  /** A default applied when the source cell is missing / empty. */
  default?: unknown;
  /** Transform the coerced value before validation. Pure, may change the type. */
  transform?: (value: unknown) => unknown;
  /**
   * Custom validator run after coercion + built-in checks. Return `true` when
   * valid, or a human message string describing why it failed.
   */
  validate?: (value: unknown) => true | string;
}

/** A declarative description of the shape you want out of a messy file. */
export interface Blueprint {
  /** Target fields. */
  fields: FieldSpec[];
  /**
   * Drop later rows whose value for this field key duplicates an earlier row.
   * Compared on the coerced value.
   */
  dedupeBy?: string;
  /** Hard cap on accepted rows (after dedupe). Extra rows are reported, not kept. */
  maxRows?: number;
  /**
   * Zero-based index of the header row in tabular sources. `"auto"` (default)
   * picks the first non-empty row. Ignored for JSON (objects carry their keys).
   */
  headerRow?: number | "auto";
}

/** One validation failure, tied to a row + field + the offending source value. */
export interface CellError {
  /** Zero-based index into the output rows. */
  row: number;
  /** The field key that failed (or `"*"` for a row-level error like dedupe). */
  field: string;
  /** The raw source value that could not be accepted. */
  value: unknown;
  /** A human-readable explanation. */
  message: string;
}

/** Summary counters for a parse run. */
export interface ParseStats {
  /** Rows read from the source (before dedupe / maxRows). */
  total: number;
  /** Rows kept in {@link ParseResult.rows}. */
  kept: number;
  /** Rows dropped as duplicates. */
  duplicates: number;
  /** Rows dropped because they exceeded {@link Blueprint.maxRows}. */
  truncated: number;
  /** Number of cells that failed validation. */
  errorCount: number;
}

/** The output of {@link applyBlueprint}. */
export interface ParseResult {
  /** Cleaned, typed rows (one object per kept source row). */
  rows: Record<string, unknown>[];
  /** Every cell that failed coercion or validation. */
  errors: CellError[];
  /** Which source column was chosen for each field (`null` when unmapped). */
  mapping: Record<string, string | null>;
  /** Run summary. */
  stats: ParseStats;
}

/** Options for {@link applyBlueprint}. */
export interface ApplyOptions {
  /**
   * Force a source column for a field, overriding the fuzzy auto-map. Maps a
   * field key to a source column name (or `null` to leave it unmapped).
   */
  mapping?: Record<string, string | null>;
}
