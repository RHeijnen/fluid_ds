import { FluidPage } from "./fluid-page.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-page")) {
  customElements.define("fluid-page", FluidPage);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-page": FluidPage;
  }
}
