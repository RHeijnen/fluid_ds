import { FluidRainbowLandscape } from "./fluid-rainbow-landscape.js";
import { FluidRainbowClock } from "./fluid-rainbow-clock.js";
import { FluidRainbowBattery } from "./fluid-rainbow-battery.js";

if (typeof customElements !== "undefined") {
  if (!customElements.get("fluid-rainbow-landscape")) {
    customElements.define("fluid-rainbow-landscape", FluidRainbowLandscape);
  }
  if (!customElements.get("fluid-rainbow-clock")) {
    customElements.define("fluid-rainbow-clock", FluidRainbowClock);
  }
  if (!customElements.get("fluid-rainbow-battery")) {
    customElements.define("fluid-rainbow-battery", FluidRainbowBattery);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-rainbow-landscape": FluidRainbowLandscape;
    "fluid-rainbow-clock": FluidRainbowClock;
    "fluid-rainbow-battery": FluidRainbowBattery;
  }
}
