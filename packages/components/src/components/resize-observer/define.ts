import { FluidResizeObserver } from "./fluid-resize-observer.js";

if (!customElements.get("fluid-resize-observer")) {
  customElements.define("fluid-resize-observer", FluidResizeObserver);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-resize-observer": FluidResizeObserver;
  }
}
