import { FluidDescriptionList } from "./fluid-description-list.js";
import { FluidDescriptionItem } from "./fluid-description-item.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-description-list"))
  customElements.define("fluid-description-list", FluidDescriptionList);
if (typeof customElements !== "undefined" && !customElements.get("fluid-description-item"))
  customElements.define("fluid-description-item", FluidDescriptionItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-description-list": FluidDescriptionList;
    "fluid-description-item": FluidDescriptionItem;
  }
}
