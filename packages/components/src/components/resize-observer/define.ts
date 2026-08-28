import { FluidResizeObserver } from "./fluid-resize-observer.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-resize-observer")) {
  customElements.define("fluid-resize-observer", FluidResizeObserver);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-resize-observer": FluidResizeObserver;
  }
}
