import { FluidMosaic } from "./fluid-mosaic.js";
import { FluidMosaicItem } from "./fluid-mosaic-item.js";

if (!customElements.get("fluid-mosaic")) {
  customElements.define("fluid-mosaic", FluidMosaic);
}
if (!customElements.get("fluid-mosaic-item")) {
  customElements.define("fluid-mosaic-item", FluidMosaicItem);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-mosaic": FluidMosaic;
    "fluid-mosaic-item": FluidMosaicItem;
  }
}
