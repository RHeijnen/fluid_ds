import { FluidSelect } from "./fluid-select.js";
import { FluidOption } from "./fluid-option.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-select")) customElements.define("fluid-select", FluidSelect);
if (typeof customElements !== "undefined" && !customElements.get("fluid-option")) customElements.define("fluid-option", FluidOption);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-select": FluidSelect;
    "fluid-option": FluidOption;
  }
}
