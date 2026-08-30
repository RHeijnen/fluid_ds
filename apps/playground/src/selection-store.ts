export type Mode = "interaction" | "design";

type Listener = (state: SelectionState) => void;

export interface SelectionState {
  mode: Mode;
  /** Tag name of the selected component, e.g. "fluid-button". */
  selectedTag: string | null;
  /**
   * The concrete preview element that was clicked. Needed for per-element
   * isolation, token edits in isolate mode are written as inline styles on
   * this exact element rather than on the shared preview root.
   */
  selectedEl: HTMLElement | null;
  /**
   * When true, token edits apply ONLY to `selectedEl` (its own inline CSS
   * variables) instead of cascading globally. Each element starts following
   * the "main" (semantic) variables; isolate lets it own unique values.
   */
  isolate: boolean;
}

/** Does this element already carry inline --fluid-* overrides? */
function hasInlineTokenOverrides(el: HTMLElement | null): boolean {
  if (!el) return false;
  for (let i = 0; i < el.style.length; i++) {
    if (el.style[i]?.startsWith("--fluid-")) return true;
  }
  return false;
}

/**
 * Tiny store for the playground's mode + currently-selected component.
 * Kept separate from the theme store so token-state and selection-state can
 * be subscribed to independently.
 */
class SelectionStore {
  private state: SelectionState = {
    mode: "interaction",
    selectedTag: null,
    selectedEl: null,
    isolate: false
  };
  private listeners = new Set<Listener>();

  get current(): SelectionState {
    return { ...this.state };
  }

  setMode(mode: Mode): void {
    if (this.state.mode === mode) return;
    this.state = { ...this.state, mode };
    // Exiting Design mode clears the selection; consumers shouldn't have to
    // remember to do this themselves.
    if (mode === "interaction") {
      this.state.selectedTag = null;
      this.state.selectedEl = null;
      this.state.isolate = false;
    }
    this.notify();
  }

  /**
   * Anchor the selection to a concrete element (and its tag). The isolate flag
   * is derived from the element: if it already owns inline overrides, we show
   * it as isolated so re-selecting an isolated element is consistent.
   */
  setSelected(tag: string | null, el: HTMLElement | null): void {
    if (this.state.selectedTag === tag && this.state.selectedEl === el) return;
    this.state = {
      ...this.state,
      selectedTag: tag,
      selectedEl: el,
      isolate: hasInlineTokenOverrides(el)
    };
    this.notify();
  }

  /** Convenience for callers that only know the tag (e.g. "clear" → null). */
  setSelectedTag(tag: string | null): void {
    this.setSelected(tag, tag ? this.state.selectedEl : null);
  }

  /** Toggle whether edits are scoped to the selected element only. */
  setIsolate(isolate: boolean): void {
    if (this.state.isolate === isolate) return;
    this.state = { ...this.state, isolate };
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.current);
  }
}

export const selectionStore = new SelectionStore();
