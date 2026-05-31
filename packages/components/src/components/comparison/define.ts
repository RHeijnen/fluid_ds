import { FluidComparison } from "./fluid-comparison.js";

if (!customElements.get("fluid-comparison")) {
  customElements.define("fluid-comparison", FluidComparison);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-comparison": FluidComparison;
  }
}
