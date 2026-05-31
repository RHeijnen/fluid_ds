import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Wraps `IntersectionObserver` in a declarative form. Observes its
 * slotted children and fires `fluid-intersect` when any of them enters
 * or leaves the viewport (or the configured root).
 *
 * Useful for lazy loading, scroll-spy, infinite scrolling, animations
 * on enter, etc.
 *
 * @summary Declarative IntersectionObserver.
 *
 * @slot - Content to observe.
 *
 * @fires fluid-intersect - Fired with detail = { entries: IntersectionObserverEntry[] }.
 */
export class FluidIntersectionObserver extends FluidElement {
  static override styles = css`
    :host {
      display: contents;
    }
  `;

  /** Disable observation. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Root margin (CSS-like string). */
  @property({ attribute: "root-margin" }) rootMargin = "0px";

  /** Threshold (single number or comma-separated list 0–1). */
  @property() threshold = "0";

  private observer: IntersectionObserver | null = null;
  private slotObserver: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.start();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stop();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("disabled") || changed.has("rootMargin") || changed.has("threshold")) {
      this.stop();
      this.start();
    }
  }

  private parsedThreshold(): number | number[] {
    const parts = this.threshold
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (parts.length <= 1) return parts[0] ?? 0;
    return parts;
  }

  private start(): void {
    if (this.disabled) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        this.dispatchEvent(
          new CustomEvent("fluid-intersect", {
            detail: { entries },
            bubbles: true,
            composed: true
          })
        );
      },
      { rootMargin: this.rootMargin, threshold: this.parsedThreshold() }
    );
    this.observeChildren();
    this.slotObserver = new MutationObserver(() => this.observeChildren());
    this.slotObserver.observe(this, { childList: true });
  }

  private observeChildren(): void {
    if (!this.observer) return;
    this.observer.disconnect();
    for (const child of Array.from(this.children)) {
      this.observer.observe(child as Element);
    }
  }

  private stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.slotObserver?.disconnect();
    this.slotObserver = null;
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
