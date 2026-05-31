import { FluidRadio } from "./fluid-radio.js";
import { FluidRadioGroup } from "./fluid-radio-group.js";

if (!customElements.get("fluid-radio")) customElements.define("fluid-radio", FluidRadio);
if (!customElements.get("fluid-radio-group"))
  customElements.define("fluid-radio-group", FluidRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-radio": FluidRadio;
    "fluid-radio-group": FluidRadioGroup;
  }
}
