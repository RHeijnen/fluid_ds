import { FluidNodeGraph } from "./fluid-node-graph.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-node-graph")) {
  customElements.define("fluid-node-graph", FluidNodeGraph);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-node-graph": FluidNodeGraph;
  }
}
