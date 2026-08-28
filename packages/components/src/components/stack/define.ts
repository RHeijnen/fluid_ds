import { FluidStack } from "./fluid-stack.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-stack")) {
  customElements.define("fluid-stack", FluidStack);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-stack": FluidStack;
  }
}
