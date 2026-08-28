import { FluidSlider } from "./fluid-slider.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-slider")) {
  customElements.define("fluid-slider", FluidSlider);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-slider": FluidSlider;
  }
}
