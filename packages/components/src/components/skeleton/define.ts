import { FluidSkeleton } from "./fluid-skeleton.js";

if (!customElements.get("fluid-skeleton")) {
  customElements.define("fluid-skeleton", FluidSkeleton);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-skeleton": FluidSkeleton;
  }
}
