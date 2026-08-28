import { FluidHero } from "./fluid-hero.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-hero")) {
  customElements.define("fluid-hero", FluidHero);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-hero": FluidHero;
  }
}
