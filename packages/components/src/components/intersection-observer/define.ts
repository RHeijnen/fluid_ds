import { FluidIntersectionObserver } from "./fluid-intersection-observer.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-intersection-observer")) {
  customElements.define("fluid-intersection-observer", FluidIntersectionObserver);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-intersection-observer": FluidIntersectionObserver;
  }
}
