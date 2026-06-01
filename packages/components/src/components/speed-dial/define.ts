import { FluidSpeedDial } from "./fluid-speed-dial.js";

if (!customElements.get("fluid-speed-dial"))
  customElements.define("fluid-speed-dial", FluidSpeedDial);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-speed-dial": FluidSpeedDial;
  }
}
