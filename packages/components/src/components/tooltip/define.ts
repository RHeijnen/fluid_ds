import { FluidTooltip } from "./fluid-tooltip.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-tooltip")) {
  customElements.define("fluid-tooltip", FluidTooltip);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tooltip": FluidTooltip;
  }
}
