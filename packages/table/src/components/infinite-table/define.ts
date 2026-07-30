import { FluidInfiniteTable } from "./fluid-infinite-table.js";

if (!customElements.get("fluid-infinite-table")) {
  customElements.define("fluid-infinite-table", FluidInfiniteTable);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-infinite-table": FluidInfiniteTable;
  }
}

export { FluidInfiniteTable };
export type {
  FluidInfiniteTableCellContext,
  FluidInfiniteTableColumn,
  FluidInfiniteTableLayoutItem,
  FluidInfiniteTableRow,
  FluidInfiniteTableSort
} from "./fluid-infinite-table.js";
