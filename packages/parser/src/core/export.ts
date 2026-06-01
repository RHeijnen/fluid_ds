/**
 * Serialize cleaned rows back out to CSV or JSON. Pure string builders so they
 * work server-side; the components layer adds the browser download on top.
 */
import type { FieldSpec } from "./types.js";

/** Serialize rows to pretty-printed JSON. */
export function toJSON(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows, null, 2);
}

/** Quote a CSV field per RFC 4180 when it contains a delimiter, quote, or newline. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialize rows to CSV. Columns come from `fields` when given (stable order +
 * labels are ignored, keys are the header), otherwise from the union of row keys.
 */
export function toCSV(rows: Record<string, unknown>[], fields?: FieldSpec[]): string {
  let columns: string[];
  if (fields && fields.length > 0) {
    columns = fields.map((f) => f.key);
  } else {
    const seen = new Set<string>();
    columns = [];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!seen.has(key)) {
          seen.add(key);
          columns.push(key);
        }
      }
    }
  }

  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => csvCell(row[col])).join(","));
  }
  return lines.join("\r\n");
}
