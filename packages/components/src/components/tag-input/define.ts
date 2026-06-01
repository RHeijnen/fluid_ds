import { FluidTagInput } from "./fluid-tag-input.js";

if (!customElements.get("fluid-tag-input")) {
  customElements.define("fluid-tag-input", FluidTagInput);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tag-input": FluidTagInput;
  }
}
