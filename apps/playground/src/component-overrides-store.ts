/**
 * Per-component token overrides.
 *
 * Sibling to `themeStore`. The theme store holds brand-wide values that reach
 * everything; this one holds values scoped to a single component type, keyed
 * by tag name:
 *
 * ```css
 * fluid-radio {
 *   --fluid-radio-accent: #e11d48;
 * }
 * ```
 *
 * This is the middle rung of the documented override ladder, brand →
 * component → instance. Isolating a radio restyles *every* radio, which is
 * what a design system change means: an id per instance (`radio-1`,
 * `radio-2`) would target one element in one preview, and the position it
 * encoded stopped meaning anything as soon as the markup was reordered.
 *
 * Applying it is one rule, not N elements: the preview injects this CSS
 * verbatim, so what is previewed is exactly what is exported.
 */

import { manifest } from "./manifest.js";

/** Map of cssVar → user-supplied value, scoped to one component tag. */
export type ComponentOverrideMap = Record<string, string>;

/** All overrides, keyed by tag name (e.g. "fluid-radio"). */
export type ComponentOverridesState = Record<string, ComponentOverrideMap>;

type Listener = (state: ComponentOverridesState) => void;

/** Re-uses the kebab transform from `referenceToCssVar` in store.ts. */
function referenceToCssVar(value: string): string | null {
  const match = /^\{([^}]+)\}$/.exec(value.trim());
  if (!match || !match[1]) return null;
  const kebab = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return `--fluid-${match[1].split(".").map(kebab).join("-")}`;
}

/** True when `cssVar` is a raw primitive rather than a semantic or component token. */
function isPrimitive(cssVar: string): boolean {
  return manifest.primitives.some((t) => t.cssVar === cssVar);
}

/**
 * Semantic re-declarations to emit alongside a primitive override.
 *
 * A custom property is substituted at the scope it was *declared*, not where
 * it is read. `--fluid-accent-base` resolves against the brand primitive up on
 * `:root`, so scoping `--fluid-color-brand-600` to `fluid-radio` alone changes
 * nothing: the semantic has already been resolved. Re-declaring the semantics
 * inside the same rule makes them resolve again, here, against the new value.
 *
 * Only emitted when a primitive is actually overridden, so a plain component
 * token override stays a one-line rule.
 */
function semanticBaseline(): string[] {
  const lines: string[] = [];
  for (const sem of manifest.semantics.light) {
    if (!sem.referencesPrimitive) continue;
    const ref = referenceToCssVar(sem.value);
    if (ref) lines.push(`  ${sem.cssVar}: var(${ref});`);
  }
  return lines;
}

class ComponentOverridesStore {
  private state: ComponentOverridesState = {};
  private listeners = new Set<Listener>();

  /** Read-only snapshot. */
  get current(): ComponentOverridesState {
    const out: ComponentOverridesState = {};
    for (const [tag, map] of Object.entries(this.state)) out[tag] = { ...map };
    return out;
  }

  /** Overrides for one component tag. Empty object when none. */
  forTag(tag: string): ComponentOverrideMap {
    return { ...(this.state[tag] ?? {}) };
  }

  /** Set one css var on one component tag. Empty string clears it. */
  set(tag: string, cssVar: string, value: string): void {
    const next: ComponentOverridesState = { ...this.state };
    const map = { ...(next[tag] ?? {}) };
    if (value === "") delete map[cssVar];
    else map[cssVar] = value;
    if (Object.keys(map).length) next[tag] = map;
    else delete next[tag];
    this.state = next;
    this.notify();
  }

  /** Drop every override for one component tag. */
  clearTag(tag: string): void {
    if (!this.state[tag]) return;
    const next = { ...this.state };
    delete next[tag];
    this.state = next;
    this.notify();
  }

  /** Replace the whole state (URL hash restore + preset load). */
  replace(state: ComponentOverridesState): void {
    const next: ComponentOverridesState = {};
    for (const [tag, map] of Object.entries(state)) {
      // Tag names are interpolated straight into a CSS selector, so only a
      // plain custom-element name is accepted from a URL a stranger wrote.
      if (typeof tag !== "string" || !/^[a-z][a-z0-9-]*$/.test(tag)) continue;
      if (typeof map !== "object" || !map) continue;
      const filtered: ComponentOverrideMap = {};
      for (const [k, v] of Object.entries(map)) {
        if (typeof k === "string" && typeof v === "string" && k.startsWith("--fluid-")) {
          filtered[k] = v;
        }
      }
      if (Object.keys(filtered).length) next[tag] = filtered;
    }
    this.state = next;
    this.notify();
  }

  /** Reset every component override. */
  reset(): void {
    if (!Object.keys(this.state).length) return;
    this.state = {};
    this.notify();
  }

  /** Subscribe; immediately invoked with the current state. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  /** How many components carry overrides. */
  size(): number {
    return Object.keys(this.state).length;
  }

  /** Total number of overridden values across every component. */
  valueCount(): number {
    return Object.values(this.state).reduce((n, map) => n + Object.keys(map).length, 0);
  }

  /**
   * Render as CSS: one rule per component tag, sorted so diffs are stable.
   * This is both the exported snippet and what the preview injects.
   */
  toCSS(): string {
    const tags = Object.keys(this.state).sort();
    if (!tags.length) return "";
    const blocks: string[] = [];
    for (const tag of tags) {
      const map = this.state[tag]!;
      const lines = Object.keys(map)
        .sort()
        .map((k) => `  ${k}: ${map[k]};`);
      if (Object.keys(map).some(isPrimitive)) lines.push(...semanticBaseline());
      blocks.push(`${tag} {\n${lines.join("\n")}\n}`);
    }
    return blocks.join("\n\n");
  }

  private notify(): void {
    const snapshot = this.current;
    for (const listener of this.listeners) listener(snapshot);
  }
}

export const componentOverridesStore = new ComponentOverridesStore();
