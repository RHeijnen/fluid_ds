/**
 * Per-field coercion + validation. Each function takes the raw source value
 * and a {@link FieldSpec} and returns either a coerced value or a human error
 * message. Pure and DOM-free.
 */
import type { FieldSpec } from "./types.js";

/** Result of coercing one cell. */
export type CoerceResult = { ok: true; value: unknown } | { ok: false; message: string };

const ok = (value: unknown): CoerceResult => ({ ok: true, value });
const fail = (message: string): CoerceResult => ({ ok: false, message });

const DEFAULT_TRUTHY = ["true", "yes", "y", "1", "on"] as const;
const DEFAULT_FALSY = ["false", "no", "n", "0", "off"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Is a source cell effectively empty (missing / blank string)? */
export function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function label(field: FieldSpec): string {
  return field.label ?? field.key;
}

/** Coerce a string-ish source value to a number, or fail. */
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value !== "string") return null;
  // Allow thousands separators + surrounding currency-ish noise stripped to a number.
  const cleaned = value.trim().replace(/,/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

/** Parse a date per the field's `format` hint. Returns an ISO string or null. */
function toISODate(value: unknown, format: FieldSpec["format"]): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const raw = String(value).trim();
  if (raw === "") return null;

  // Slash / dot separated dates honor the US vs EU hint.
  const parts = raw.match(/^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})$/);
  if (parts) {
    const a = Number(parts[1]);
    const b = Number(parts[2]);
    const c = Number(parts[3]);
    let year: number;
    let month: number;
    let day: number;
    if (parts[1] && parts[1].length === 4) {
      // YYYY-MM-DD
      year = a;
      month = b;
      day = c;
    } else if (format === "us") {
      month = a;
      day = b;
      year = c;
    } else {
      // eu + default for ambiguous slash dates
      day = a;
      month = b;
      year = c;
    }
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Fall back to native Date parsing for ISO / timestamp strings.
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  // Date-only ISO inputs stay date-only.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return parsed.toISOString();
}

/** Coerce + range/format-check one cell against a field. Custom validate runs in applyBlueprint. */
export function coerceCell(raw: unknown, field: FieldSpec): CoerceResult {
  // Empty -> default / required check.
  if (isEmpty(raw)) {
    if (field.default !== undefined) return ok(field.default);
    if (field.required) return fail(`${label(field)} is required`);
    return ok(field.type === "string" ? "" : null);
  }

  switch (field.type) {
    case "string": {
      const value = typeof raw === "string" ? raw : String(raw);
      if (field.min !== undefined && value.length < field.min)
        return fail(`${label(field)} must be at least ${field.min} characters`);
      if (field.max !== undefined && value.length > field.max)
        return fail(`${label(field)} must be at most ${field.max} characters`);
      if (field.pattern && !toRegExp(field.pattern).test(value))
        return fail(`${label(field)} does not match the required format`);
      return ok(value);
    }

    case "number":
    case "integer": {
      const n = toNumber(raw);
      if (n === null) return fail(`${label(field)} is not a number: "${String(raw)}"`);
      if (field.type === "integer" && !Number.isInteger(n))
        return fail(`${label(field)} must be a whole number: "${String(raw)}"`);
      if (field.min !== undefined && n < field.min)
        return fail(`${label(field)} must be ≥ ${field.min}`);
      if (field.max !== undefined && n > field.max)
        return fail(`${label(field)} must be ≤ ${field.max}`);
      return ok(n);
    }

    case "boolean": {
      if (typeof raw === "boolean") return ok(raw);
      const s = String(raw).trim().toLowerCase();
      const truthy: readonly string[] = field.truthy
        ? field.truthy.map((t) => t.toLowerCase())
        : DEFAULT_TRUTHY;
      if (truthy.includes(s)) return ok(true);
      if ((DEFAULT_FALSY as readonly string[]).includes(s)) return ok(false);
      // A non-empty unrecognized token is false only when no custom truthy set
      // was given, otherwise it is an error so typos are caught.
      if (field.truthy) return fail(`${label(field)} is not a recognized boolean: "${String(raw)}"`);
      return ok(false);
    }

    case "date": {
      const iso = toISODate(raw, field.format);
      if (iso === null) return fail(`${label(field)} is not a valid date: "${String(raw)}"`);
      const time = new Date(iso).getTime();
      if (field.min !== undefined && time < field.min)
        return fail(`${label(field)} is before the allowed range`);
      if (field.max !== undefined && time > field.max)
        return fail(`${label(field)} is after the allowed range`);
      return ok(iso);
    }

    case "email": {
      const value = String(raw).trim();
      if (!EMAIL_RE.test(value)) return fail(`${label(field)} is not a valid email: "${value}"`);
      return ok(value.toLowerCase());
    }

    case "url": {
      const value = String(raw).trim();
      try {
        const url = new URL(value);
        return ok(url.href);
      } catch {
        return fail(`${label(field)} is not a valid URL: "${value}"`);
      }
    }

    case "enum": {
      const options = field.options ?? [];
      // Match case-insensitively against string options, exactly for numbers.
      for (const option of options) {
        if (typeof option === "number") {
          if (toNumber(raw) === option) return ok(option);
        } else if (String(raw).trim().toLowerCase() === option.toLowerCase()) {
          return ok(option);
        }
      }
      return fail(`${label(field)} must be one of: ${options.join(", ")}`);
    }

    case "json": {
      if (typeof raw === "object") return ok(raw);
      try {
        return ok(JSON.parse(String(raw)));
      } catch {
        return fail(`${label(field)} is not valid JSON`);
      }
    }

    case "custom":
      // No built-in coercion; the field's `transform` + `validate` own it.
      return ok(raw);

    default:
      return ok(raw);
  }
}

/** Compile a string pattern to a RegExp (string patterns are anchored loosely, case-sensitive). */
function toRegExp(pattern: RegExp | string): RegExp {
  return pattern instanceof RegExp ? pattern : new RegExp(pattern);
}
