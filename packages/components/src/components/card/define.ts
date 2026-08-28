import { FluidCard } from "./fluid-card.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-card")) {
  customElements.define("fluid-card", FluidCard);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-card": FluidCard;
  }
}
