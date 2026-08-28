import { FluidImage } from "./fluid-image.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-image")) {
  customElements.define("fluid-image", FluidImage);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-image": FluidImage;
  }
}
