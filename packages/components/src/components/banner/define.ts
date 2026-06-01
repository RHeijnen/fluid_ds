import { FluidBanner } from "./fluid-banner.js";

if (!customElements.get("fluid-banner")) {
  customElements.define("fluid-banner", FluidBanner);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-banner": FluidBanner;
  }
}
