import { FluidDrawer } from "./fluid-drawer.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-drawer")) {
  customElements.define("fluid-drawer", FluidDrawer);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-drawer": FluidDrawer;
  }
}
