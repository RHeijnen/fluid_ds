/**
 * Per-element token overrides.
 *
 * Sibling to `themeStore`. Where the theme store holds **brand-wide**
 * overrides that cascade through a `[data-fluid-brand="custom"]` wrapper,
 * this store holds **per-instance** overrides keyed by `data-fluid-id`.
 *
 * Why a separate store: brand-level overrides are global theme state
 * (one set per session), per-element overrides are a map of independent
 * mini-themes, one per tagged element. Different shape, different export.
 *
 * Selector convention in the exported CSS:
 *
 * ```css
 * [data-fluid-id="primary-cta"] {
 *   --fluid-button-bg: #...;
 * }
 * ```
 *
 * The consumer adds the matching `data-fluid-id` attribute to whichever
 * element should receive the override. The attribute name is part of the
 * Fluid namespace (`data-fluid-brand`, `data-fluid-theme`, etc.) so it
 * stays distinct from the consumer's own class/id system.
 */

import { manifest } from "./manifest.js";

/** Map of cssVar → user-supplied value, scoped to one element. */
export type ElementOverrideMap = Record<string, string>;

/** All overrides, keyed by data-fluid-id. */
export type ElementOverridesState = Record<string, ElementOverrideMap>;

type Listener = (state: ElementOverridesState) => void;

/** Re-uses the kebab transform from `referenceToCssVar` in store.ts. */
function referenceToCssVar(value: string): string | null {
  const match = /^\{([^}]+)\}$/.exec(value.trim());
  if (!match || !match[1]) return null;
  const kebab = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return `--fluid-${match[1].split(".").map(kebab).join("-")}`;
}

/** Default semantic token reference, copy of the snippet from themeStore.applyTo. */
function applySemanticBaseline(el: HTMLElement): void {
  for (const sem of manifest.semantics.light) {
    if (sem.referencesPrimitive) {
      const ref = referenceToCssVar(sem.value);
      if (ref && !el.style.getPropertyValue(sem.cssVar)) {
        el.style.setProperty(sem.cssVar, `var(${ref})`);
      }
    }
  }
}

class ElementOverridesStore {
  private state: ElementOverridesState = {};
  private listeners = new Set<Listener>();

  /** Read-only snapshot. */
  get current(): ElementOverridesState {
    // Deep-clone two levels so consumers can't mutate our internals.
    const out: ElementOverridesState = {};
    for (const [id, map] of Object.entries(this.state)) out[id] = { ...map };
    return out;
  }

  /** Overrides for one element. Returns empty object if none. */
  forId(id: string): ElementOverrideMap {
    return { ...(this.state[id] ?? {}) };
  }

  /** Set one css var on one element id. Empty string clears it. */
  set(id: string, cssVar: string, value: string): void {
    const next: ElementOverridesState = { ...this.state };
    const map = { ...(next[id] ?? {}) };
    if (value === "") delete map[cssVar];
    else map[cssVar] = value;
    if (Object.keys(map).length) next[id] = map;
    else delete next[id];
    this.state = next;
    this.notify();
  }

  /** Drop all overrides for one element id. */
  clearId(id: string): void {
    if (!this.state[id]) return;
    const next = { ...this.state };
    delete next[id];
    this.state = next;
    this.notify();
  }

  /** Replace the whole state (used by URL hash restore + preset load). */
  replace(state: ElementOverridesState): void {
    const next: ElementOverridesState = {};
    for (const [id, map] of Object.entries(state)) {
      if (typeof id !== "string" || typeof map !== "object" || !map) continue;
      const filtered: ElementOverrideMap = {};
      for (const [k, v] of Object.entries(map)) {
        if (typeof k === "string" && typeof v === "string") filtered[k] = v;
      }
      if (Object.keys(filtered).length) next[id] = filtered;
    }
    this.state = next;
    this.notify();
  }

  /** Reset every element override. */
  reset(): void {
    if (!Object.keys(this.state).length) return;
    this.state = {};
    this.notify();
  }

  /** Subscribe; immediately invoked with current state. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  /**
   * Apply the override map for one id onto a concrete element by writing
   * inline `--fluid-*` styles. Also stamps the `data-fluid-id` attribute
   * so the export selector matches at runtime in the playground preview.
   */
  applyTo(id: string, el: HTMLElement): void {
    const map = this.state[id] ?? {};
    // Clear any leftover --fluid-* from a previous apply we don't own anymore.
    const ours = new Set<string>();
    for (let i = 0; i < el.style.length; i++) {
      const prop = el.style[i];
      if (prop && prop.startsWith("--fluid-")) ours.add(prop);
    }
    for (const prop of ours) {
      if (!(prop in map)) el.style.removeProperty(prop);
    }
    // Apply current map. Also re-declare semantic tokens at this scope so
    // overriding a primitive cascades through to its semantic, same gotcha
    // as themeStore.applyTo, just scoped to this one element.
    if (Object.keys(map).length) {
      applySemanticBaseline(el);
      el.setAttribute("data-fluid-id", id);
      for (const [k, v] of Object.entries(map)) el.style.setProperty(k, v);
    }
  }

  /**
   * Render as CSS, emits one rule block per id, sorted by id name so
   * diffs are stable.
   */
  toCSS(): string {
    const ids = Object.keys(this.state).sort();
    if (!ids.length) return "";
    const blocks: string[] = [];
    for (const id of ids) {
      const map = this.state[id]!;
      const lines = Object.keys(map)
        .sort()
        .map((k) => `  ${k}: ${map[k]};`);
      blocks.push(`[data-fluid-id="${id}"] {\n${lines.join("\n")}\n}`);
    }
    return blocks.join("\n\n");
  }

  /** Count of distinct element overrides (handy for status displays). */
  size(): number {
    return Object.keys(this.state).length;
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.current);
  }
}

export const elementOverridesStore = new ElementOverridesStore();
