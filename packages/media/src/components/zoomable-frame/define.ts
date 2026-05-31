import { FluidZoomableFrame } from "./fluid-zoomable-frame.js";

if (!customElements.get("fluid-zoomable-frame")) {
  customElements.define("fluid-zoomable-frame", FluidZoomableFrame);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-zoomable-frame": FluidZoomableFrame;
  }
}
