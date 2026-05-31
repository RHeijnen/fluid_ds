import { FluidBadge } from "./fluid-badge.js";

if (!customElements.get("fluid-badge")) {
  customElements.define("fluid-badge", FluidBadge);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-badge": FluidBadge;
  }
}
