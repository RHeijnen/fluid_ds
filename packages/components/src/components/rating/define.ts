import { FluidRating } from "./fluid-rating.js";

if (!customElements.get("fluid-rating")) {
  customElements.define("fluid-rating", FluidRating);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-rating": FluidRating;
  }
}
