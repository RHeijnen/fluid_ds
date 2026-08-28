import { FluidField } from "./fluid-field.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-field")) {
  customElements.define("fluid-field", FluidField);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-field": FluidField;
  }
}
