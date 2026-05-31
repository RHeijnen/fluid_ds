import { FluidInput } from "./fluid-input.js";

if (!customElements.get("fluid-input")) {
  customElements.define("fluid-input", FluidInput);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-input": FluidInput;
  }
}
