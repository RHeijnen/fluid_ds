/**
 * Apply a {@link Blueprint} to a {@link RawTable}: auto-map columns, then
 * coerce + validate every cell, dedupe, and cap. Returns cleaned rows plus a
 * full error report. Pure and DOM-free.
 */
import type { ApplyOptions, Blueprint, CellError, ParseResult, RawTable } from "./types.js";
import { autoMap } from "./mapping.js";
import { coerceCell, isEmpty } from "./coerce.js";

/**
 * Map, coerce, and validate `raw` against `blueprint`.
 *
 * The returned `rows` always contains one cleaned object per kept source row
 * (even rows with errors, so a UI can show the bad cell in context); `errors`
 * lists every failing cell. Unmapped non-required fields get their default or
 * `null`; an unmapped required field marks every row's cell as an error.
 */
export function applyBlueprint(
  raw: RawTable,
  blueprint: Blueprint,
  options: ApplyOptions = {}
): ParseResult {
  const mapping = { ...autoMap(raw.columns, blueprint), ...(options.mapping ?? {}) };

  const errors: CellError[] = [];
  const cleaned: Record<string, unknown>[] = [];
  let duplicates = 0;
  let truncated = 0;

  const seenDedupe = new Set<string>();
  const maxRows = blueprint.maxRows ?? Infinity;

  raw.rows.forEach((sourceRow, rowIndex) => {
    const out: Record<string, unknown> = {};
    const rowErrors: CellError[] = [];

    for (const field of blueprint.fields) {
      const column = mapping[field.key] ?? null;
      const rawValue = column === null ? undefined : sourceRow[column];

      // Unmapped + required = the source never provided this field.
      if (column === null && field.required && field.default === undefined) {
        out[field.key] = null;
        rowErrors.push({
          row: cleaned.length,
          field: field.key,
          value: rawValue,
          message: `${field.label ?? field.key} is required but no column is mapped to it`,
          diagnostic: {
            code: "unmappedRequired",
            parameters: { label: field.label ?? field.key }
          }
        });
        continue;
      }

      const coerced = coerceCell(rawValue, field);
      if (!coerced.ok) {
        out[field.key] = isEmpty(rawValue) ? null : rawValue;
        rowErrors.push({
          row: cleaned.length,
          field: field.key,
          value: rawValue,
          message: coerced.message,
          diagnostic: {
            code: coerced.code,
            parameters: coerced.parameters
          } as NonNullable<CellError["diagnostic"]>
        });
        continue;
      }

      let value = coerced.value;
      if (field.transform) {
        try {
          value = field.transform(value);
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          rowErrors.push({
            row: cleaned.length,
            field: field.key,
            value: rawValue,
            message: `${field.label ?? field.key} transform failed: ${reason}`,
            diagnostic: {
              code: "transformFailed",
              parameters: {
                label: field.label ?? field.key,
                reason
              }
            }
          });
        }
      }

      if (field.validate) {
        const result = field.validate(value);
        if (result !== true) {
          rowErrors.push({
            row: cleaned.length,
            field: field.key,
            value: rawValue,
            message: typeof result === "string" ? result : `${field.label ?? field.key} is invalid`,
            diagnostic: {
              code: "customValidation",
              parameters: { label: field.label ?? field.key }
            }
          });
        }
      }

      out[field.key] = value;
    }

    // Dedupe on the coerced value of the chosen key.
    if (blueprint.dedupeBy) {
      const dedupeValue = out[blueprint.dedupeBy];
      const dedupeKey = JSON.stringify(dedupeValue ?? null);
      if (seenDedupe.has(dedupeKey)) {
        duplicates += 1;
        return;
      }
      seenDedupe.add(dedupeKey);
    }

    if (cleaned.length >= maxRows) {
      truncated += 1;
      return;
    }

    errors.push(...rowErrors);
    cleaned.push(out);
    void rowIndex;
  });

  return {
    rows: cleaned,
    errors,
    mapping,
    stats: {
      total: raw.rows.length,
      kept: cleaned.length,
      duplicates,
      truncated,
      errorCount: errors.length
    }
  };
}
