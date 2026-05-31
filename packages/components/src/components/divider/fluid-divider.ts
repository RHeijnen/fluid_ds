import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidDividerOrientation = "horizontal" | "vertical";

/**
 * A horizontal or vertical separator.
 *
 * Uses role="separator" so assistive tech announces sectioning correctly.
 *
 * @summary Thin line separator.
 *
 * @cssproperty --fluid-divider-color - Line color.
 * @cssproperty --fluid-divider-width - Line thickness.
 *
 * @uses-token --fluid-border-default - Default line color.
 */
export class FluidDivider extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      border: 0;
      background: var(--fluid-divider-color, var(--fluid-border-default));
    }

    :host([orientation="horizontal"]) {
      width: 100%;
      height: var(--fluid-divider-width, 1px);
    }

    :host([orientation="vertical"]) {
      display: inline-block;
      width: var(--fluid-divider-width, 1px);
      align-self: stretch;
      min-height: 1em;
    }

    :host([hidden]) {
      display: none;
    }
  `;

  /** Orientation. */
  @property({ reflect: true }) orientation: FluidDividerOrientation = "horizontal";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
    if (!this.hasAttribute("aria-orientation")) {
      this.setAttribute("aria-orientation", this.orientation);
    }
  }

  override render(): TemplateResult {
    return html``;
  }
}
