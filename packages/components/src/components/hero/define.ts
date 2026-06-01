import { FluidHero } from "./fluid-hero.js";

if (!customElements.get("fluid-hero")) {
  customElements.define("fluid-hero", FluidHero);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-hero": FluidHero;
  }
}
