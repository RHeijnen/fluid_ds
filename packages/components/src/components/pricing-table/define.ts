import { FluidPricingTable } from "./fluid-pricing-table.js";
import { FluidPricingTier } from "./fluid-pricing-tier.js";

if (!customElements.get("fluid-pricing-table")) {
  customElements.define("fluid-pricing-table", FluidPricingTable);
}

if (!customElements.get("fluid-pricing-tier")) {
  customElements.define("fluid-pricing-tier", FluidPricingTier);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-pricing-table": FluidPricingTable;
    "fluid-pricing-tier": FluidPricingTier;
  }
}
