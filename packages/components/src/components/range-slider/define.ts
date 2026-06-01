import { FluidRangeSlider } from "./fluid-range-slider.js";

if (!customElements.get("fluid-range-slider")) {
  customElements.define("fluid-range-slider", FluidRangeSlider);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-range-slider": FluidRangeSlider;
  }
}
