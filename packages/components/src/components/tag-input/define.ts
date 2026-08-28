import { FluidTagInput } from "./fluid-tag-input.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-tag-input")) {
  customElements.define("fluid-tag-input", FluidTagInput);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tag-input": FluidTagInput;
  }
}
