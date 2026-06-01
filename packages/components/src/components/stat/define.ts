import { FluidStat } from "./fluid-stat.js";

if (!customElements.get("fluid-stat")) {
  customElements.define("fluid-stat", FluidStat);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-stat": FluidStat;
  }
}
