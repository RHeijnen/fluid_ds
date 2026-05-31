import { FluidAnimation } from "./fluid-animation.js";

if (!customElements.get("fluid-animation")) {
  customElements.define("fluid-animation", FluidAnimation);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-animation": FluidAnimation;
  }
}
