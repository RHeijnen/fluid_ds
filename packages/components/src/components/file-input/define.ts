import { FluidFileInput } from "./fluid-file-input.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-file-input")) {
  customElements.define("fluid-file-input", FluidFileInput);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-file-input": FluidFileInput;
  }
}
