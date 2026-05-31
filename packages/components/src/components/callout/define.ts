import { FluidCallout } from "./fluid-callout.js";

if (!customElements.get("fluid-callout")) {
  customElements.define("fluid-callout", FluidCallout);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-callout": FluidCallout;
  }
}
