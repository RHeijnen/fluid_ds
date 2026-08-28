import { FluidSkeleton } from "./fluid-skeleton.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-skeleton")) {
  customElements.define("fluid-skeleton", FluidSkeleton);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-skeleton": FluidSkeleton;
  }
}
