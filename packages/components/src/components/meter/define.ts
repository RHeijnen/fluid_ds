import { FluidMeter } from "./fluid-meter.js";

if (!customElements.get("fluid-meter")) {
  customElements.define("fluid-meter", FluidMeter);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-meter": FluidMeter;
  }
}
