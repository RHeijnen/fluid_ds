import { LitElement } from "lit";
import {
  LocalizationController,
  type FluidTranslationArguments,
  type FluidTranslationTerm
} from "./localization.js";

/**
 * Base class for every Fluid component.
 *
 * Beyond a shared namespace, it provides opt-in **teardown helpers** so a
 * component never leaks a timer, observer, listener, or in-flight fetch past
 * disconnect. The audit that motivated these helpers found the single most
 * common bug class to be side effects started in `connectedCallback` /
 * `firstUpdated` that were never undone, because the base was empty and every
 * component had to hand-roll cleanup, the one that forgot leaked silently.
 *
 * All helpers are **additive**: a component that ignores them behaves exactly
 * like a plain `LitElement`. A component that uses them only needs to remember
 * to call `super.disconnectedCallback()` if it overrides the lifecycle hook
 * (which Lit already requires).
 */
export class FluidElement extends LitElement {
  static override get observedAttributes(): string[] {
    return [...new Set([...super.observedAttributes, "aria-label", "aria-labelledby"])];
  }

  protected readonly localize = new LocalizationController(this);
  /** Teardown callbacks, each run once on disconnect. */
  #cleanups = new Set<() => void>();
  /** Aborted on disconnect; a fresh one is minted on the next access. */
  #abort?: AbortController;
  #usesDefaultAriaLabel: boolean | undefined;
  #settingDefaultAriaLabel = false;
  #hasDefaultAriaLabel = false;

  /**
   * An `AbortSignal` that aborts when the element disconnects. Pass it to
   * `addEventListener(type, handler, { signal })`, `fetch(url, { signal })`, an
   * `IntersectionObserver`, etc. so the subscription tears down automatically.
   * A fresh signal is minted after a reconnect.
   */
  protected get disconnectSignal(): AbortSignal {
    if (!this.#abort) this.#abort = new AbortController();
    return this.#abort.signal;
  }

  /**
   * Register a callback to run once when the element disconnects, e.g.
   * `registerCleanup(() => clearInterval(id))`,
   * `registerCleanup(() => observer.disconnect())`,
   * `registerCleanup(() => animation.cancel())`. Returns a disposer that runs
   * the callback early and unregisters it.
   */
  protected registerCleanup(fn: () => void): () => void {
    this.#cleanups.add(fn);
    return () => {
      if (this.#cleanups.delete(fn)) fn();
    };
  }

  /**
   * Add an event listener that is automatically removed on disconnect (it is
   * wired to {@link disconnectSignal}). Returns a disposer to remove it early.
   */
  protected listen<K extends keyof GlobalEventHandlersEventMap>(
    target: EventTarget,
    type: K,
    handler: (event: GlobalEventHandlersEventMap[K]) => unknown,
    options?: AddEventListenerOptions
  ): () => void;
  protected listen(
    target: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions
  ): () => void;
  protected listen(
    target: EventTarget,
    type: string,
    handler: unknown,
    options?: AddEventListenerOptions
  ): () => void {
    const listener = handler as EventListenerOrEventListenerObject;
    const opts: AddEventListenerOptions = { ...options, signal: this.disconnectSignal };
    target.addEventListener(type, listener, opts);
    return this.registerCleanup(() => target.removeEventListener(type, listener, opts));
  }

  /**
   * True only when `key` changed to a genuinely new value, NOT on the initial
   * render. Lit records every reactive property in the first `changedProperties`
   * with an `undefined` old value (and `this.hasUpdated` is already `true`
   * inside `updated()`), so `changed.has(key)` alone fires public change events
   * at mount. Gate `fluid-change` / `fluid-toggle` / `fluid-hide` with this so
   * they only fire on real, user-driven transitions:
   *
   *   if (this.changedAfterFirstRender(changed, "value")) this.emitChange();
   */
  protected changedAfterFirstRender(changed: Map<PropertyKey, unknown>, key: PropertyKey): boolean {
    return changed.has(key) && changed.get(key) !== undefined;
  }

  /** Resolve a built-in UI term from the nearest `lang` context. */
  protected term<K extends FluidTranslationTerm>(
    key: K,
    ...args: FluidTranslationArguments<K>
  ): string {
    return this.localize.term(key, ...args);
  }

  /** Effective writing direction from the nearest `dir` or locale context. */
  protected get isRtl(): boolean {
    return this.localize.dir === "rtl";
  }

  /**
   * Keep a translated host name until the consumer authors one. Existing
   * attributes, including server-rendered ones, are author-owned: ownership
   * is never inferred by comparing text with an English default.
   */
  protected updateDefaultAriaLabel(label: string): void {
    this.#hasDefaultAriaLabel = true;
    this.#usesDefaultAriaLabel ??= !this.hasAttribute("aria-label");
    if (!this.#usesDefaultAriaLabel) return;
    const desired = this.hasAttribute("aria-labelledby") ? null : label;
    if (this.getAttribute("aria-label") === desired) return;
    this.#settingDefaultAriaLabel = true;
    try {
      if (desired === null) this.removeAttribute("aria-label");
      else this.setAttribute("aria-label", desired);
    } finally {
      this.#settingDefaultAriaLabel = false;
    }
  }

  override attributeChangedCallback(
    name: string,
    oldValue: string | null,
    value: string | null
  ): void {
    super.attributeChangedCallback(name, oldValue, value);
    if (name === "aria-label" && !this.#settingDefaultAriaLabel) {
      this.#usesDefaultAriaLabel = value === null;
    }
    if (
      this.#hasDefaultAriaLabel &&
      !this.#settingDefaultAriaLabel &&
      (name === "aria-label" || name === "aria-labelledby")
    ) {
      this.requestUpdate();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#abort?.abort();
    this.#abort = undefined;
    // Snapshot + clear first so a cleanup that (re)registers can't loop, and so
    // one throwing cleanup never blocks the rest.
    const fns = [...this.#cleanups];
    this.#cleanups.clear();
    for (const fn of fns) {
      try {
        fn();
      } catch {
        /* a leaking cleanup must not strand the others */
      }
    }
  }
}
