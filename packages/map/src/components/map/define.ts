import { FluidMap } from "./fluid-map.js";

if (!customElements.get("fluid-map")) {
  customElements.define("fluid-map", FluidMap);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-map": FluidMap;
  }
}
