import { themeStore } from "./store.js";
import { elementOverridesStore } from "./element-overrides-store.js";

/**
 * Serializes both override stores into the URL hash so themes are shareable
 * links, and restores them on load.
 *
 * Hash format: `#theme=<b64>` (brand overrides) and/or
 *               `#elements=<b64>` (per-element overrides). Each is its own
 * URL-safe base64-encoded JSON blob so a consumer can copy just one if they
 * only need part of the state.
 */

const THEME_KEY = "theme";
const ELEMENTS_KEY = "elements";

function encode(obj: unknown): string {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode<T>(value: string): T | null {
  try {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

function readHashValue<T>(key: string): T | null {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const value = params.get(key);
  if (!value) return null;
  return decode<T>(value);
}

function writeHashValues(
  theme: Record<string, string>,
  elements: Record<string, Record<string, string>>
): void {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (Object.keys(theme).length === 0) params.delete(THEME_KEY);
  else params.set(THEME_KEY, encode(theme));
  if (Object.keys(elements).length === 0) params.delete(ELEMENTS_KEY);
  else params.set(ELEMENTS_KEY, encode(elements));
  const newHash = params.toString();
  // Replace state so we don't pollute history with every keystroke.
  history.replaceState(null, "", newHash ? `#${newHash}` : window.location.pathname);
}

/**
 * Filter incoming hash values to string maps so we don't crash on hostile
 * input. The theme map is flat (cssVar → value), the elements map is nested
 * (id → cssVar → value).
 */
function sanitizeFlat(raw: unknown): Record<string, string> {
  if (typeof raw !== "object" || raw === null) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k === "string" && typeof v === "string") out[k] = v;
  }
  return out;
}

function sanitizeNested(raw: unknown): Record<string, Record<string, string>> {
  if (typeof raw !== "object" || raw === null) return {};
  const out: Record<string, Record<string, string>> = {};
  for (const [id, inner] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof id !== "string") continue;
    const flat = sanitizeFlat(inner);
    if (Object.keys(flat).length) out[id] = flat;
  }
  return out;
}

/**
 * Restore stores from URL on load, then keep URL in sync with store changes.
 * Call once at app bootstrap.
 */
export function syncUrlState(): void {
  // Restore both stores from the hash. Order doesn't matter, they don't
  // reference each other.
  const theme = readHashValue<Record<string, unknown>>(THEME_KEY);
  if (theme) themeStore.replace(sanitizeFlat(theme));
  const elements = readHashValue<Record<string, unknown>>(ELEMENTS_KEY);
  if (elements) elementOverridesStore.replace(sanitizeNested(elements));

  // Batch hash writes: every store change schedules a single rAF write so
  // burst edits (e.g. dragging a slider) don't thrash the URL bar.
  let queued = false;
  const queueWrite = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      writeHashValues(themeStore.diff(), elementOverridesStore.current);
    });
  };
  themeStore.subscribe(queueWrite);
  elementOverridesStore.subscribe(queueWrite);

  window.addEventListener("hashchange", () => {
    const t = readHashValue<Record<string, unknown>>(THEME_KEY);
    themeStore.replace(t ? sanitizeFlat(t) : {});
    const e = readHashValue<Record<string, unknown>>(ELEMENTS_KEY);
    elementOverridesStore.replace(e ? sanitizeNested(e) : {});
  });
}
