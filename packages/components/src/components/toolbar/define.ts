import { FluidToolbar } from "./fluid-toolbar.js";

if (!customElements.get("fluid-toolbar")) {
  customElements.define("fluid-toolbar", FluidToolbar);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-toolbar": FluidToolbar;
  }
}
