import { FluidAccordion } from "./fluid-accordion.js";
import { FluidDetails } from "./fluid-details.js";

if (!customElements.get("fluid-accordion"))
  customElements.define("fluid-accordion", FluidAccordion);
if (!customElements.get("fluid-details")) customElements.define("fluid-details", FluidDetails);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-accordion": FluidAccordion;
    "fluid-details": FluidDetails;
  }
}
