import { FluidEmptyState } from "./fluid-empty-state.js";

if (!customElements.get("fluid-empty-state")) {
  customElements.define("fluid-empty-state", FluidEmptyState);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-empty-state": FluidEmptyState;
  }
}
