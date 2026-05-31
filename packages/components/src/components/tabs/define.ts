import { FluidTabs } from "./fluid-tabs.js";
import { FluidTab } from "./fluid-tab.js";
import { FluidTabPanel } from "./fluid-tab-panel.js";

if (!customElements.get("fluid-tabs")) customElements.define("fluid-tabs", FluidTabs);
if (!customElements.get("fluid-tab")) customElements.define("fluid-tab", FluidTab);
if (!customElements.get("fluid-tab-panel"))
  customElements.define("fluid-tab-panel", FluidTabPanel);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tabs": FluidTabs;
    "fluid-tab": FluidTab;
    "fluid-tab-panel": FluidTabPanel;
  }
}
