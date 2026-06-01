/**
 * A small, dependency-free RFC 4180 CSV / TSV parser.
 *
 * Handles quoted fields, escaped quotes (`""`), embedded newlines + delimiters
 * inside quotes, and both `\n` and `\r\n` line endings. The delimiter is either
 * given or sniffed.
 */

/** Delimiters we sniff between. */
export type Delimiter = "," | ";" | "\t";

/**
 * Tokenize delimited text into a grid of raw string cells. Pure: no header /
 * type handling here, that is layered on top.
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  // A row only counts as "started" once we have seen a character on it, so a
  // trailing newline does not produce a spurious empty row.
  let started = false;

  const endField = (): void => {
    row.push(field);
    field = "";
  };
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
    started = false;
  };

  while (i < n) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote.
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      started = true;
      i += 1;
      continue;
    }
    if (char === delimiter) {
      started = true;
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      // Swallow CR; the following LF (if any) closes the row.
      if (text[i + 1] === "\n") {
        endRow();
        i += 2;
      } else {
        endRow();
        i += 1;
      }
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    started = true;
    i += 1;
  }

  // Flush the final field / row when the file does not end in a newline, or
  // when we are mid-field.
  if (started || field.length > 0 || row.length > 0) {
    endRow();
  }

  return rows;
}

/**
 * Sniff the most likely delimiter from the first few lines by scoring each
 * candidate on how consistently it splits rows into the same column count.
 */
export function sniffDelimiter(text: string): Delimiter {
  const sample = text.split(/\r\n|\n|\r/).filter((l) => l.length > 0).slice(0, 10);
  if (sample.length === 0) return ",";

  const candidates: Delimiter[] = [",", ";", "\t"];
  let best: Delimiter = ",";
  let bestScore = -1;

  for (const delimiter of candidates) {
    const counts = sample.map((line) => countOutsideQuotes(line, delimiter));
    const max = Math.max(...counts);
    if (max === 0) continue; // delimiter never appears
    // Reward consistency (same count on every line) and field richness.
    const consistent = counts.filter((c) => c === max).length;
    const score = consistent * 100 + max;
    if (score > bestScore) {
      bestScore = score;
      best = delimiter;
    }
  }

  return best;
}

/** Count a delimiter's occurrences on one line, ignoring quoted regions. */
function countOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === delimiter) count += 1;
  }
  return count;
}
