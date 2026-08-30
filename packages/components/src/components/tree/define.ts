import { FluidTree } from "./fluid-tree.js";
import { FluidTreeItem } from "./fluid-tree-item.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-tree"))
  customElements.define("fluid-tree", FluidTree);
if (typeof customElements !== "undefined" && !customElements.get("fluid-tree-item"))
  customElements.define("fluid-tree-item", FluidTreeItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tree": FluidTree;
    "fluid-tree-item": FluidTreeItem;
  }
}
