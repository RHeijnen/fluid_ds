import { FluidAnchorNav } from "./fluid-anchor-nav.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-anchor-nav")) {
  customElements.define("fluid-anchor-nav", FluidAnchorNav);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-anchor-nav": FluidAnchorNav;
  }
}
