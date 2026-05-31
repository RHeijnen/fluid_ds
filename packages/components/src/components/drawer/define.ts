import { FluidDrawer } from "./fluid-drawer.js";

if (!customElements.get("fluid-drawer")) {
  customElements.define("fluid-drawer", FluidDrawer);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-drawer": FluidDrawer;
  }
}
