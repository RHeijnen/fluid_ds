import { FluidMosaic } from "./fluid-mosaic.js";
import { FluidMosaicItem } from "./fluid-mosaic-item.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-mosaic")) {
  customElements.define("fluid-mosaic", FluidMosaic);
}
if (typeof customElements !== "undefined" && !customElements.get("fluid-mosaic-item")) {
  customElements.define("fluid-mosaic-item", FluidMosaicItem);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-mosaic": FluidMosaic;
    "fluid-mosaic-item": FluidMosaicItem;
  }
}
