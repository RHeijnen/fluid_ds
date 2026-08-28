import { FluidEmptyState } from "./fluid-empty-state.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-empty-state")) {
  customElements.define("fluid-empty-state", FluidEmptyState);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-empty-state": FluidEmptyState;
  }
}
