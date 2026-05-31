import { FluidTypeahead } from "./fluid-typeahead.js";

if (!customElements.get("fluid-typeahead")) {
  customElements.define("fluid-typeahead", FluidTypeahead);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-typeahead": FluidTypeahead;
  }
}
