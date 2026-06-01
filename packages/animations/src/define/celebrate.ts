/**
 * Side-effect entry that defines the `<fluid-celebrate>` custom element.
 *
 * ```ts
 * import "@fluid-ds/animations/define/celebrate";
 * ```
 *
 * ```html
 * <fluid-celebrate effect="confetti" auto></fluid-celebrate>
 * ```
 */
import { FluidCelebrate } from "../effects/fluid-celebrate.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-celebrate")) {
  customElements.define("fluid-celebrate", FluidCelebrate);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-celebrate": FluidCelebrate;
  }
}
