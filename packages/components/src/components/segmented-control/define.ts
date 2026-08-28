import { FluidSegmentedControl } from "./fluid-segmented-control.js";
import { FluidSegment } from "./fluid-segment.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-segmented-control"))
  customElements.define("fluid-segmented-control", FluidSegmentedControl);
if (typeof customElements !== "undefined" && !customElements.get("fluid-segment")) customElements.define("fluid-segment", FluidSegment);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-segmented-control": FluidSegmentedControl;
    "fluid-segment": FluidSegment;
  }
}
