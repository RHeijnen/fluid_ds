import { FluidLightbox } from "./fluid-lightbox.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-lightbox")) {
  customElements.define("fluid-lightbox", FluidLightbox);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-lightbox": FluidLightbox;
  }
}
