import { FluidAspectRatio } from "./fluid-aspect-ratio.js";

if (!customElements.get("fluid-aspect-ratio")) {
  customElements.define("fluid-aspect-ratio", FluidAspectRatio);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-aspect-ratio": FluidAspectRatio;
  }
}
