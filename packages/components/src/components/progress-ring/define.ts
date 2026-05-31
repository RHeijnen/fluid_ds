import { FluidProgressRing } from "./fluid-progress-ring.js";

if (!customElements.get("fluid-progress-ring")) {
  customElements.define("fluid-progress-ring", FluidProgressRing);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-progress-ring": FluidProgressRing;
  }
}
