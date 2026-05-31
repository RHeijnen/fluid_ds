import { FluidPopup } from "./fluid-popup.js";

if (!customElements.get("fluid-popup")) {
  customElements.define("fluid-popup", FluidPopup);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-popup": FluidPopup;
  }
}
