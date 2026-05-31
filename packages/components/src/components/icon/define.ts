import { FluidIcon } from "./fluid-icon.js";

if (!customElements.get("fluid-icon")) {
  customElements.define("fluid-icon", FluidIcon);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-icon": FluidIcon;
  }
}
