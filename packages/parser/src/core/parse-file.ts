/**
 * Format detection + file reading. Produces a {@link RawTable} from a dropped
 * `File`, regardless of source format. The header-row choice is applied here so
 * downstream code always sees named columns.
 *
 * XLSX support is loaded lazily: `xlsx` (SheetJS) is only imported when an
 * actual `.xlsx` / `.xls` file is dropped, keeping the base bundle tiny.
 */
import type { FileFormat, RawTable } from "./types.js";
import { parseDelimited, sniffDelimiter, type Delimiter } from "./csv.js";

/** Options for {@link parseFile}. */
export interface ParseFileOptions {
  /** Force a format instead of detecting it. */
  format?: FileFormat;
  /** Header row for tabular sources. `"auto"` (default) finds the first non-empty row. */
  headerRow?: number | "auto";
  /** Force a CSV / TSV delimiter instead of sniffing it. */
  delimiter?: Delimiter;
}

/** Detect the format from a filename extension + a content sniff. */
export function detectFormat(name: string, sample: string): FileFormat {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "json") return "json";
  if (ext === "tsv") return "tsv";
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls" || ext === "xlsm") return "xlsx";

  // No (or unknown) extension: sniff the content.
  const trimmed = sample.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  // SheetJS / zip magic bytes ("PK") imply an xlsx.
  if (sample.startsWith("PK")) return "xlsx";
  const firstLine = sample.split(/\r\n|\n|\r/, 1)[0] ?? "";
  if (firstLine.includes("\t")) return "tsv";
  return "csv";
}

/**
 * Read + parse a dropped file into a {@link RawTable}.
 *
 * @throws Error when the bytes cannot be parsed as the detected format.
 */
export async function parseFile(file: File, options: ParseFileOptions = {}): Promise<RawTable> {
  const headerRow = options.headerRow ?? "auto";

  // xlsx is binary; everything else is text. We peek at a text slice first to
  // detect, then read fully in the right mode.
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const looksBinary = ext === "xlsx" || ext === "xls" || ext === "xlsm";

  if (options.format === "xlsx" || (options.format === undefined && looksBinary)) {
    return parseXlsx(file, headerRow);
  }

  const text = await file.text();
  const format = options.format ?? detectFormat(file.name, text.slice(0, 4096));

  switch (format) {
    case "xlsx":
      return parseXlsx(file, headerRow);
    case "json":
      return parseJson(text);
    case "tsv":
      return gridToTable(parseDelimited(text, "\t"), headerRow);
    case "csv": {
      const delimiter = options.delimiter ?? sniffDelimiter(text);
      return gridToTable(parseDelimited(text, delimiter), headerRow);
    }
    default:
      return parseJson(text);
  }
}

/** Parse JSON: an array of objects, or `{ columns, rows }`, or `{ data: [...] }`. */
export function parseJson(text: string): RawTable {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`);
  }

  let records: unknown[];
  if (Array.isArray(data)) {
    records = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.rows)) {
      records = obj.rows;
    } else if (Array.isArray(obj.data)) {
      records = obj.data;
    } else {
      // A single object becomes a single row.
      records = [obj];
    }
  } else {
    throw new Error("JSON must be an array of objects or an object with a rows/data array.");
  }

  const columns: string[] = [];
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  for (const record of records) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      // Scalar / array entry: wrap under a "value" column so it is still usable.
      if (!seen.has("value")) {
        seen.add("value");
        columns.push("value");
      }
      rows.push({ value: record });
      continue;
    }
    const row = record as Record<string, unknown>;
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
    rows.push({ ...row });
  }

  return { columns, rows };
}

/** Convert a raw cell grid into a {@link RawTable}, honoring the header-row choice. */
export function gridToTable(grid: string[][], headerRow: number | "auto"): RawTable {
  const nonEmpty = (cells: string[]): boolean => cells.some((c) => c.trim() !== "");

  let headerIndex: number;
  if (headerRow === "auto") {
    headerIndex = grid.findIndex(nonEmpty);
    if (headerIndex < 0) return { columns: [], rows: [] };
  } else {
    headerIndex = headerRow;
  }

  const header = grid[headerIndex] ?? [];
  const columns = dedupeHeaders(header.map((h, i) => (h.trim() === "" ? `column_${i + 1}` : h.trim())));

  const rows: Record<string, unknown>[] = [];
  for (let r = headerIndex + 1; r < grid.length; r += 1) {
    const cells = grid[r];
    if (!cells || !nonEmpty(cells)) continue; // skip fully-blank lines
    const row: Record<string, unknown> = {};
    for (let c = 0; c < columns.length; c += 1) {
      const key = columns[c];
      if (key === undefined) continue;
      row[key] = cells[c] ?? "";
    }
    rows.push(row);
  }

  return { columns, rows };
}

/** Make header names unique (a, a -> a, a_2) so two columns never collide. */
function dedupeHeaders(headers: string[]): string[] {
  const counts = new Map<string, number>();
  return headers.map((name) => {
    const seen = counts.get(name) ?? 0;
    counts.set(name, seen + 1);
    return seen === 0 ? name : `${name}_${seen + 1}`;
  });
}

/** Read the first sheet of an XLSX file. SheetJS is imported lazily here. */
async function parseXlsx(file: File, headerRow: number | "auto"): Promise<RawTable> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { columns: [], rows: [] };
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { columns: [], rows: [] };

  // Read as a raw grid (header: 1) so our header-row logic stays in one place.
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: ""
  });
  const stringGrid: string[][] = grid.map((cells) =>
    (cells as unknown[]).map((cell) => (cell == null ? "" : String(cell)))
  );
  return gridToTable(stringGrid, headerRow);
}
