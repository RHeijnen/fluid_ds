import { FluidList } from "./fluid-list.js";
import { FluidListItem } from "./fluid-list-item.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-list")) {
  customElements.define("fluid-list", FluidList);
}

if (typeof customElements !== "undefined" && !customElements.get("fluid-list-item")) {
  customElements.define("fluid-list-item", FluidListItem);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-list": FluidList;
    "fluid-list-item": FluidListItem;
  }
}
