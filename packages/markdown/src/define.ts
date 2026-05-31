import { FluidMarkdown } from "./fluid-markdown.js";

if (!customElements.get("fluid-markdown")) {
  customElements.define("fluid-markdown", FluidMarkdown);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-markdown": FluidMarkdown;
  }
}
