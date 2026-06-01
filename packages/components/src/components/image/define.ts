import { FluidImage } from "./fluid-image.js";

if (!customElements.get("fluid-image")) {
  customElements.define("fluid-image", FluidImage);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-image": FluidImage;
  }
}
