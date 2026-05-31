import { FluidSpinner } from "./fluid-spinner.js";

if (!customElements.get("fluid-spinner")) {
  customElements.define("fluid-spinner", FluidSpinner);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-spinner": FluidSpinner;
  }
}
