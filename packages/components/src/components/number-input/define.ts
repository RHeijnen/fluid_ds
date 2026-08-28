import { FluidNumberInput } from "./fluid-number-input.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-number-input")) {
  customElements.define("fluid-number-input", FluidNumberInput);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-number-input": FluidNumberInput;
  }
}
