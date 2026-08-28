import { FluidBanner } from "./fluid-banner.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-banner")) {
  customElements.define("fluid-banner", FluidBanner);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-banner": FluidBanner;
  }
}
