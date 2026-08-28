import { FluidCheckbox } from "./fluid-checkbox.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-checkbox")) {
  customElements.define("fluid-checkbox", FluidCheckbox);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-checkbox": FluidCheckbox;
  }
}
