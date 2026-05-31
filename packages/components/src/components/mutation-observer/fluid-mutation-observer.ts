import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Wraps the platform's `MutationObserver` in a declarative form. Wraps
 * its slotted children and fires `fluid-mutation` whenever they change.
 *
 * Useful for reactive setups (e.g. updating a count when items are
 * added/removed) without writing observer wiring by hand.
 *
 * @summary Declarative MutationObserver.
 *
 * @slot - Content to observe.
 *
 * @fires fluid-mutation - Fired with detail = { records: MutationRecord[] }.
 */
export class FluidMutationObserver extends FluidElement {
  static override styles = css`
    :host {
      display: contents;
    }
  `;

  /** Observe attribute mutations. */
  @property({ type: Boolean }) attr = false;

  /** Observe child list mutations. */
  @property({ type: Boolean, attribute: "child-list" }) childList = false;

  /** Observe character data. */
  @property({ type: Boolean, attribute: "char-data" }) charData = false;

  /** Observe subtree. */
  @property({ type: Boolean }) subtree = false;

  /** Disable observation. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Comma-separated attribute filter (only fires for these attributes). */
  @property({ attribute: "attr-filter" }) attrFilter: string | null = null;

  private observer: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.startObserving();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopObserving();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (
      changed.has("attr") ||
      changed.has("childList") ||
      changed.has("charData") ||
      changed.has("subtree") ||
      changed.has("disabled") ||
      changed.has("attrFilter")
    ) {
      this.stopObserving();
      this.startObserving();
    }
  }

  private startObserving(): void {
    if (this.disabled) return;
    const opts: MutationObserverInit = {
      attributes: this.attr,
      childList: this.childList,
      characterData: this.charData,
      subtree: this.subtree
    };
    if (this.attrFilter) {
      opts.attributeFilter = this.attrFilter.split(",").map((s) => s.trim());
    }
    if (!opts.attributes && !opts.childList && !opts.characterData) return;
    this.observer = new MutationObserver((records) => {
      this.dispatchEvent(
        new CustomEvent("fluid-mutation", {
          detail: { records },
          bubbles: true,
          composed: true
        })
      );
    });
    this.observer.observe(this, opts);
  }

  private stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
