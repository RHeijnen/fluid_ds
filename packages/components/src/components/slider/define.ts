import { FluidSlider } from "./fluid-slider.js";

if (!customElements.get("fluid-slider")) {
  customElements.define("fluid-slider", FluidSlider);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-slider": FluidSlider;
  }
}
