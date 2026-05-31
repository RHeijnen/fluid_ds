import { FluidIntersectionObserver } from "./fluid-intersection-observer.js";

if (!customElements.get("fluid-intersection-observer")) {
  customElements.define("fluid-intersection-observer", FluidIntersectionObserver);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-intersection-observer": FluidIntersectionObserver;
  }
}
