import { FluidDivider } from "./fluid-divider.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-divider")) {
  customElements.define("fluid-divider", FluidDivider);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-divider": FluidDivider;
  }
}
