import { FluidSwitch } from "./fluid-switch.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-switch")) {
  customElements.define("fluid-switch", FluidSwitch);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-switch": FluidSwitch;
  }
}
