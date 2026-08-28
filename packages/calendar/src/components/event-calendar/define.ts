import { FluidEventCalendar } from "./fluid-event-calendar.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-event-calendar")) {
  customElements.define("fluid-event-calendar", FluidEventCalendar);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-event-calendar": FluidEventCalendar;
  }
}
