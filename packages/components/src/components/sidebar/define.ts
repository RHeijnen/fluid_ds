import { FluidSidebar } from "./fluid-sidebar.js";

if (!customElements.get("fluid-sidebar")) {
  customElements.define("fluid-sidebar", FluidSidebar);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-sidebar": FluidSidebar;
  }
}
