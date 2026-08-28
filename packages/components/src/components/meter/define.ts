import { FluidMeter } from "./fluid-meter.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-meter")) {
  customElements.define("fluid-meter", FluidMeter);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-meter": FluidMeter;
  }
}
