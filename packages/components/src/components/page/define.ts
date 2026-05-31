import { FluidPage } from "./fluid-page.js";

if (!customElements.get("fluid-page")) {
  customElements.define("fluid-page", FluidPage);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-page": FluidPage;
  }
}
