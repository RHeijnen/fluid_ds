import { FluidTooltip } from "./fluid-tooltip.js";

if (!customElements.get("fluid-tooltip")) {
  customElements.define("fluid-tooltip", FluidTooltip);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tooltip": FluidTooltip;
  }
}
