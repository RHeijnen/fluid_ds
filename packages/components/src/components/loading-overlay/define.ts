import { FluidLoadingOverlay } from "./fluid-loading-overlay.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-loading-overlay")) {
  customElements.define("fluid-loading-overlay", FluidLoadingOverlay);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-loading-overlay": FluidLoadingOverlay;
  }
}
