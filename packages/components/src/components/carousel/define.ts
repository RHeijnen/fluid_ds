import { FluidCarousel } from "./fluid-carousel.js";
import { FluidCarouselItem } from "./fluid-carousel-item.js";

if (!customElements.get("fluid-carousel")) customElements.define("fluid-carousel", FluidCarousel);
if (!customElements.get("fluid-carousel-item"))
  customElements.define("fluid-carousel-item", FluidCarouselItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-carousel": FluidCarousel;
    "fluid-carousel-item": FluidCarouselItem;
  }
}
