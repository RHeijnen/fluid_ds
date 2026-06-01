import { FluidLightbox } from "./fluid-lightbox.js";

if (!customElements.get("fluid-lightbox")) {
  customElements.define("fluid-lightbox", FluidLightbox);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-lightbox": FluidLightbox;
  }
}
