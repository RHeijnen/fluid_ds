import { FluidScroller } from "./fluid-scroller.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-scroller")) {
  customElements.define("fluid-scroller", FluidScroller);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-scroller": FluidScroller;
  }
}
