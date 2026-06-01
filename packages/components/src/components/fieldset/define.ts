import { FluidFieldset } from "./fluid-fieldset.js";

if (!customElements.get("fluid-fieldset")) {
  customElements.define("fluid-fieldset", FluidFieldset);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-fieldset": FluidFieldset;
  }
}
