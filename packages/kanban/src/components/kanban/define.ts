import { FluidKanban } from "./fluid-kanban.js";

if (!customElements.get("fluid-kanban")) {
  customElements.define("fluid-kanban", FluidKanban);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-kanban": FluidKanban;
  }
}
