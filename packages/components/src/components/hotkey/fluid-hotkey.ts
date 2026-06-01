import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Declarative keyboard-shortcut registrar. Renders nothing (it is a
 * non-visual behavior element, like the observer components) and reads no
 * design tokens, so there is no token override ladder. Drop it anywhere,
 * set `keys`, and listen for `fluid-hotkey`.
 *
 * Key syntax:
 * - A chord is `+`-joined, e.g. `mod+k`, `shift+?`, `ctrl+alt+delete`.
 * - `mod` resolves to Cmd on macOS and Ctrl elsewhere, so a single binding
 *   works cross-platform.
 * - A space-separated sequence, e.g. `g h`, fires only when the chords are
 *   pressed in order within a short timeout.
 *
 * Matching is case-insensitive and compares against `event.key`, so
 * `shift+?` matches the produced "?" character (not "shift+/").
 *
 * @summary Declarative, cross-platform keyboard shortcuts.
 *
 * @fires fluid-hotkey - Fired on a match with detail = { keys: string, event: KeyboardEvent }.
 */
export class FluidHotkey extends FluidElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  /**
   * The shortcut to listen for. A `+`-joined chord (`mod+k`, `shift+?`) or a
   * space-separated sequence of chords (`g h`). `mod` = Cmd on macOS, Ctrl
   * elsewhere.
   */
  @property() keys = "";

  /**
   * Where to attach the listener: `window` (default), `document`, or a CSS
   * selector resolved against the owning document.
   */
  @property() target: "window" | "document" | (string & {}) = "window";

  /** Call `preventDefault()` on the originating event when the shortcut matches. */
  @property({ type: Boolean, attribute: "prevent-default", reflect: true })
  preventDefault = false;

  /**
   * Also fire when focus is in a text input, textarea, or contenteditable.
   * Defaults to `false`: such fields are ignored so typing does not trigger
   * shortcuts.
   */
  @property({ type: Boolean, attribute: "when-input", reflect: true })
  whenInput = false;

  private attachedTarget: EventTarget | null = null;
  private boundHandler = (event: KeyboardEvent): void => this.handleKeydown(event);

  /** Parsed sequence of chords; each chord is a Set of normalized tokens. */
  private sequence: Set<string>[] = [];
  /** How far through a multi-chord sequence we currently are. */
  private sequenceIndex = 0;
  private sequenceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Window between chords in a sequence, in milliseconds. */
  private static readonly SEQUENCE_TIMEOUT = 1000;

  override connectedCallback(): void {
    super.connectedCallback();
    this.parseKeys();
    this.attach();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.detach();
    this.clearSequenceTimer();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("keys")) {
      this.parseKeys();
      this.resetSequence();
    }
    if (changed.has("target")) {
      this.detach();
      this.attach();
    }
  }

  private parseKeys(): void {
    this.sequence = this.keys
      .trim()
      .split(/\s+/)
      .filter((chord) => chord.length > 0)
      .map((chord) => {
        const tokens = chord
          .split("+")
          .map((token) => this.normalizeToken(token))
          .filter((token) => token.length > 0);
        return new Set(tokens);
      })
      .filter((set) => set.size > 0);
  }

  private normalizeToken(token: string): string {
    const lower = token.trim().toLowerCase();
    if (lower === "mod") return this.isMac() ? "meta" : "control";
    if (lower === "cmd" || lower === "command" || lower === "meta") return "meta";
    if (lower === "ctrl" || lower === "control") return "control";
    if (lower === "opt" || lower === "option" || lower === "alt") return "alt";
    if (lower === "shift") return "shift";
    if (lower === "esc") return "escape";
    if (lower === "space" || lower === "spacebar") return " ";
    return lower;
  }

  private isMac(): boolean {
    if (typeof navigator === "undefined") return false;
    return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
  }

  private resolveTarget(): EventTarget | null {
    if (this.target === "window") {
      return typeof window === "undefined" ? null : window;
    }
    if (this.target === "document") {
      return this.ownerDocument ?? null;
    }
    return this.ownerDocument?.querySelector(this.target) ?? null;
  }

  private attach(): void {
    const target = this.resolveTarget();
    if (!target) return;
    this.attachedTarget = target;
    target.addEventListener("keydown", this.boundHandler as EventListener);
  }

  private detach(): void {
    if (!this.attachedTarget) return;
    this.attachedTarget.removeEventListener("keydown", this.boundHandler as EventListener);
    this.attachedTarget = null;
  }

  private isEditableTarget(event: KeyboardEvent): boolean {
    const path = event.composedPath();
    for (const node of path) {
      if (!(node instanceof HTMLElement)) continue;
      const tag = node.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (node.isContentEditable) return true;
    }
    return false;
  }

  private chordMatches(chord: Set<string>, event: KeyboardEvent): boolean {
    const pressedModifiers = {
      meta: event.metaKey,
      control: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey
    };
    const key = event.key.toLowerCase();

    // Every modifier the chord requires must be held, and any modifier it
    // does NOT require must not be held (shift is exempt: it is implied by
    // shifted characters like "?").
    for (const [name, held] of Object.entries(pressedModifiers)) {
      const required = chord.has(name);
      if (name === "shift") {
        if (required && !held) return false;
        continue;
      }
      if (required !== held) return false;
    }

    // The non-modifier key in the chord must match the produced key.
    const nonModifiers = [...chord].filter(
      (token) => token !== "meta" && token !== "control" && token !== "alt" && token !== "shift"
    );
    if (nonModifiers.length === 0) {
      // Modifier-only chord (rare): a match means no extra key beyond modifiers.
      return key === "meta" || key === "control" || key === "alt" || key === "shift";
    }
    return nonModifiers.every((token) => token === key);
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (this.sequence.length === 0) return;
    if (!this.whenInput && this.isEditableTarget(event)) return;

    const expected = this.sequence[this.sequenceIndex];
    if (!expected) {
      this.resetSequence();
      return;
    }

    if (!this.chordMatches(expected, event)) {
      // A miss restarts the sequence, but re-test against the first chord so
      // a fresh start is not swallowed.
      this.resetSequence();
      const first = this.sequence[0];
      if (first && this.chordMatches(first, event)) {
        this.advanceSequence(event);
      }
      return;
    }

    this.advanceSequence(event);
  }

  private advanceSequence(event: KeyboardEvent): void {
    this.sequenceIndex += 1;
    if (this.sequenceIndex >= this.sequence.length) {
      this.resetSequence();
      if (this.preventDefault) event.preventDefault();
      this.dispatchEvent(
        new CustomEvent("fluid-hotkey", {
          detail: { keys: this.keys, event },
          bubbles: true,
          composed: true
        })
      );
      return;
    }
    // Mid-sequence: arm the timeout so a slow follow-up resets.
    this.clearSequenceTimer();
    this.sequenceTimer = setTimeout(
      () => this.resetSequence(),
      FluidHotkey.SEQUENCE_TIMEOUT
    );
  }

  private resetSequence(): void {
    this.sequenceIndex = 0;
    this.clearSequenceTimer();
  }

  private clearSequenceTimer(): void {
    if (this.sequenceTimer !== null) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
