import { FluidFieldset } from "./fluid-fieldset.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-fieldset")) {
  customElements.define("fluid-fieldset", FluidFieldset);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-fieldset": FluidFieldset;
  }
}
