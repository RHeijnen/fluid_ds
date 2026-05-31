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
    this.addEventListener("fluid-toggle", this.handleToggle);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("fluid-toggle", this.handleToggle);
  }

  protected override updated(_: PropertyValues<this>): void {
    /* No specific update logic needed here yet. */
  }

  private handleToggle = (e: Event) => {
    if (!this.single) return;
    const target = e.target as FluidDetails;
    if (!target.open) return;
    for (const detail of this.querySelectorAll("fluid-details")) {
      if (detail !== target) (detail as FluidDetails).open = false;
    }
  };

  override render(): TemplateResult {
    return html`<div part="base"><slot></slot></div>`;
  }
}
