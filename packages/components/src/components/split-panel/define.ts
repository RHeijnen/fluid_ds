import { FluidSplitPanel } from "./fluid-split-panel.js";

if (!customElements.get("fluid-split-panel")) {
  customElements.define("fluid-split-panel", FluidSplitPanel);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-split-panel": FluidSplitPanel;
  }
}
