import { FluidStat } from "./fluid-stat.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-stat")) {
  customElements.define("fluid-stat", FluidStat);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-stat": FluidStat;
  }
}
