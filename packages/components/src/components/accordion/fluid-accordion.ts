import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import type { FluidDetails } from "./fluid-details.js";

/**
 * Groups multiple `<fluid-details>` elements. Optionally enforces "only one open
 * at a time" behavior.
 *
 * @summary Container for stacked `<fluid-details>`.
 *
 * @slot - One or more `<fluid-details>` elements.
 *
 * @csspart base - The outer container.
 */
export class FluidAccordion extends FluidElement {
  private panelObserver?: MutationObserver;

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }
  `;

  /**
   * When true, opening one panel closes the others.
   */
  @property({ type: Boolean }) single = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.listen(this, "fluid-toggle", this.handleToggle as EventListener);
    this.panelObserver ??= new MutationObserver(() => this.reconcileOpenPanels());
    this.panelObserver.observe(this, { childList: true });
    this.reconcileOpenPanels();
  }

  override disconnectedCallback(): void {
    this.panelObserver?.disconnect();
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("single")) this.reconcileOpenPanels();
  }

  private handleToggle = (e: Event) => {
    if (!this.single) return;
    const target = e.target as FluidDetails;
    if (target.parentElement !== this || !target.open) return;
    for (const detail of this.getPanels()) {
      if (detail !== target) detail.open = false;
    }
  };

  private handleSlotChange = () => this.reconcileOpenPanels();

  private getPanels(): FluidDetails[] {
    return Array.from(this.children).filter(
      (child): child is FluidDetails => child.localName === "fluid-details"
    );
  }

  private reconcileOpenPanels(): void {
    if (!this.single) return;
    const openPanels = this.getPanels().filter((panel) => panel.open);
    for (const panel of openPanels.slice(1)) panel.open = false;
  }

  override render(): TemplateResult {
    return html`<div part="base"><slot @slotchange=${this.handleSlotChange}></slot></div>`;
  }
}
