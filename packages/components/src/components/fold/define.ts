import { FluidFold } from "./fluid-fold.js";

if (!customElements.get("fluid-fold")) {
  customElements.define("fluid-fold", FluidFold);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-fold": FluidFold;
  }
}
