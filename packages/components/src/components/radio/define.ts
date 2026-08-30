import { FluidRadio } from "./fluid-radio.js";
import { FluidRadioGroup } from "./fluid-radio-group.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-radio"))
  customElements.define("fluid-radio", FluidRadio);
if (typeof customElements !== "undefined" && !customElements.get("fluid-radio-group"))
  customElements.define("fluid-radio-group", FluidRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-radio": FluidRadio;
    "fluid-radio-group": FluidRadioGroup;
  }
}
