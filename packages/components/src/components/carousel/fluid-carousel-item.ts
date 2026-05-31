import { html, css, type TemplateResult } from "lit";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A single slide inside a `<fluid-carousel>`. Use one per logical slide.
 *
 * @summary Carousel slide.
 *
 * @slot - Slide content.
 *
 * @csspart base - The slide container.
 */
export class FluidCarouselItem extends FluidElement {
  static override styles = css`
    :host {
      flex: 0 0 100%;
      width: 100%;
      box-sizing: border-box;
      scroll-snap-align: center;
      scroll-snap-stop: always;
      display: block;
      min-height: 0;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (!this.hasAttribute("aria-roledescription")) {
      this.setAttribute("aria-roledescription", "slide");
    }
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
