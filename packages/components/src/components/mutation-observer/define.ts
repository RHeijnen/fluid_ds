import { FluidMutationObserver } from "./fluid-mutation-observer.js";

if (!customElements.get("fluid-mutation-observer")) {
  customElements.define("fluid-mutation-observer", FluidMutationObserver);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-mutation-observer": FluidMutationObserver;
  }
}
