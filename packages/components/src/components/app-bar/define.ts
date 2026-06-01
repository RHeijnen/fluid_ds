import { FluidAppBar } from "./fluid-app-bar.js";

if (!customElements.get("fluid-app-bar")) {
  customElements.define("fluid-app-bar", FluidAppBar);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-app-bar": FluidAppBar;
  }
}
