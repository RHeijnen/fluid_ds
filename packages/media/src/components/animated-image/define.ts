import { FluidAnimatedImage } from "./fluid-animated-image.js";

if (!customElements.get("fluid-animated-image")) {
  customElements.define("fluid-animated-image", FluidAnimatedImage);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-animated-image": FluidAnimatedImage;
  }
}
