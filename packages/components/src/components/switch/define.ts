import { FluidSwitch } from "./fluid-switch.js";

if (!customElements.get("fluid-switch")) {
  customElements.define("fluid-switch", FluidSwitch);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-switch": FluidSwitch;
  }
}
