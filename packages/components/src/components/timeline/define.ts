import { FluidTimeline } from "./fluid-timeline.js";
import { FluidTimelineItem } from "./fluid-timeline-item.js";

if (!customElements.get("fluid-timeline"))
  customElements.define("fluid-timeline", FluidTimeline);
if (!customElements.get("fluid-timeline-item"))
  customElements.define("fluid-timeline-item", FluidTimelineItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-timeline": FluidTimeline;
    "fluid-timeline-item": FluidTimelineItem;
  }
}
