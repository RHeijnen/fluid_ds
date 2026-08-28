import { FluidSpinner } from "./fluid-spinner.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-spinner")) {
  customElements.define("fluid-spinner", FluidSpinner);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-spinner": FluidSpinner;
  }
}
