import { FluidIcon } from "./fluid-icon.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-icon")) {
  customElements.define("fluid-icon", FluidIcon);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-icon": FluidIcon;
  }
}
