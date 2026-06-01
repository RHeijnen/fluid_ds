/**
 * Auto-map source columns to blueprint fields by fuzzy name matching.
 *
 * Matching is case-insensitive and punctuation-insensitive ("First Name",
 * "first_name", and "firstName" all normalize the same), tries the field key,
 * its label, and every alias, and falls back to a token-overlap score so a
 * near-miss still maps. Each source column is used at most once.
 */
import type { Blueprint, FieldSpec } from "./types.js";

/** Lower-case, strip non-alphanumerics, so naming styles collapse together. */
export function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Split into normalized word tokens for overlap scoring. */
function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Candidate names a field is willing to answer to. */
function candidates(field: FieldSpec): string[] {
  const names = [field.key];
  if (field.label) names.push(field.label);
  if (field.aliases) names.push(...field.aliases);
  return names;
}

/**
 * Score how well a source column matches a field. 1 = exact (normalized),
 * 0.9 = one contains the other, otherwise a token-overlap ratio. 0 = no match.
 */
function score(column: string, field: FieldSpec): number {
  const col = normalize(column);
  if (!col) return 0;
  let best = 0;
  for (const candidate of candidates(field)) {
    const cand = normalize(candidate);
    if (!cand) continue;
    if (col === cand) return 1;
    if (col.includes(cand) || cand.includes(col)) {
      best = Math.max(best, 0.9);
      continue;
    }
    const a = new Set(tokens(column));
    const b = tokens(candidate);
    if (b.length === 0) continue;
    const overlap = b.filter((t) => a.has(t)).length;
    if (overlap > 0) {
      best = Math.max(best, (overlap / Math.max(a.size, b.length)) * 0.8);
    }
  }
  return best;
}

/** Minimum score before we accept an auto-map (below this, a field stays unmapped). */
const THRESHOLD = 0.4;

/**
 * Build a `{ fieldKey -> sourceColumn | null }` mapping. Greedy by best score,
 * highest-confidence pairs win first, and each source column is claimed once.
 */
export function autoMap(columns: string[], blueprint: Blueprint): Record<string, string | null> {
  const pairs: { field: string; column: string; score: number }[] = [];
  for (const field of blueprint.fields) {
    for (const column of columns) {
      const s = score(column, field);
      if (s >= THRESHOLD) pairs.push({ field: field.key, column, score: s });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const mapping: Record<string, string | null> = {};
  for (const field of blueprint.fields) mapping[field.key] = null;
  const takenColumns = new Set<string>();
  const takenFields = new Set<string>();

  for (const { field, column, score: s } of pairs) {
    if (takenFields.has(field) || takenColumns.has(column)) continue;
    mapping[field] = column;
    takenFields.add(field);
    takenColumns.add(column);
    void s;
  }

  return mapping;
}
