import { FluidAccordion } from "./fluid-accordion.js";
import { FluidDetails } from "./fluid-details.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-accordion"))
  customElements.define("fluid-accordion", FluidAccordion);
if (typeof customElements !== "undefined" && !customElements.get("fluid-details")) customElements.define("fluid-details", FluidDetails);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-accordion": FluidAccordion;
    "fluid-details": FluidDetails;
  }
}
