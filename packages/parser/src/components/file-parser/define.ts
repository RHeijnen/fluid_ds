import { FluidFileParser } from "./fluid-file-parser.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-file-parser")) {
  customElements.define("fluid-file-parser", FluidFileParser);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-file-parser": FluidFileParser;
  }
}
