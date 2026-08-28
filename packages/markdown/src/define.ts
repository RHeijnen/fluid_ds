import { FluidMarkdown } from "./fluid-markdown.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-markdown")) {
  customElements.define("fluid-markdown", FluidMarkdown);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-markdown": FluidMarkdown;
  }
}
