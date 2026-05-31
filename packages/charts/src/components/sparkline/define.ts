import { FluidSparkline } from "./fluid-sparkline.js";

if (!customElements.get("fluid-sparkline")) {
  customElements.define("fluid-sparkline", FluidSparkline);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-sparkline": FluidSparkline;
  }
}
