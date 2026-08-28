import { FluidRichTextEditor } from "./fluid-rich-text-editor.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-rich-text-editor")) {
  customElements.define("fluid-rich-text-editor", FluidRichTextEditor);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-rich-text-editor": FluidRichTextEditor;
  }
}
