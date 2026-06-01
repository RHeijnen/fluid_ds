import { FluidCalendar } from "./fluid-calendar.js";

if (!customElements.get("fluid-calendar")) customElements.define("fluid-calendar", FluidCalendar);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-calendar": FluidCalendar;
  }
}
