import { FluidGrid } from "./fluid-grid.js";
import { FluidCol } from "./fluid-col.js";

if (!customElements.get("fluid-grid")) {
  customElements.define("fluid-grid", FluidGrid);
}
if (!customElements.get("fluid-col")) {
  customElements.define("fluid-col", FluidCol);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-grid": FluidGrid;
    "fluid-col": FluidCol;
  }
}
