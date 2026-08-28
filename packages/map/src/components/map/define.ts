import { FluidMap } from "./fluid-map.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-map")) {
  customElements.define("fluid-map", FluidMap);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-map": FluidMap;
  }
}
