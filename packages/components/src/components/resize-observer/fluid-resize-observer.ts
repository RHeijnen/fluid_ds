import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Wraps `ResizeObserver` in a declarative form. Observes its slotted
 * children and fires `fluid-resize` whenever any of them changes size.
 *
 * @summary Declarative ResizeObserver.
 *
 * @slot - Content to observe.
 *
 * @fires fluid-resize - Fired with detail = { entries: ResizeObserverEntry[] }.
 */
export class FluidResizeObserver extends FluidElement {
  static override styles = css`
    :host {
      display: contents;
    }
  `;

  /** Disable observation. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Observed box (content-box, border-box, device-pixel-content-box). */
  @property() box: ResizeObserverBoxOptions = "content-box";

  private observer: ResizeObserver | null = null;
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
    if (changed.has("disabled") || changed.has("box")) {
      this.stop();
      this.start();
    }
  }

  private start(): void {
    if (this.disabled) return;
    this.observer = new ResizeObserver((entries) => {
      this.dispatchEvent(
        new CustomEvent("fluid-resize", {
          detail: { entries },
          bubbles: true,
          composed: true
        })
      );
    });
    this.observeChildren();
    // If light children change, re-observe.
    this.slotObserver = new MutationObserver(() => this.observeChildren());
    this.slotObserver.observe(this, { childList: true });
  }

  private observeChildren(): void {
    if (!this.observer) return;
    this.observer.disconnect();
    for (const child of Array.from(this.children)) {
      this.observer.observe(child as Element, { box: this.box });
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
