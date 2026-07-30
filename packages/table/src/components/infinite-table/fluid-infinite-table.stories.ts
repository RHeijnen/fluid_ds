import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type {
  FluidInfiniteTableColumn,
  FluidInfiniteTableRow
} from "./fluid-infinite-table.js";

const rows: FluidInfiniteTableRow[] = Array.from({ length: 80 }, (_, index) => ({
  id: index + 1,
  terminal: `Apollo ${String(index + 1).padStart(3, "0")}`,
  serialNumber: `APL2026${String(index + 1).padStart(7, "0")}`,
  site: { name: ["Amsterdam", "Rotterdam", "Utrecht"][index % 3] },
  online: index % 7 !== 0
}));

const columns: FluidInfiniteTableColumn[] = [
  {
    key: "terminal",
    label: "Terminal",
    width: "16rem",
    sortable: true,
    renderCell: ({ row }) => html`
      <strong>${row["terminal"]}</strong><br />
      <small>${row["serialNumber"]}</small>
    `
  },
  { key: "site", path: "site.name", label: "Site", width: "12rem" },
  {
    key: "status",
    label: "Status",
    width: "8rem",
    renderCell: ({ row }) =>
      html`<span>${row["online"] ? "● Online" : "○ Offline"}</span>`
  }
];

const meta: Meta = {
  title: "Table/Infinite table",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`
    <fluid-infinite-table
      caption="Terminal fleet"
      hide-caption
      configurable
      scroll-mode="container"
      style="--fluid-infinite-table-height:32rem"
      .columns=${columns}
      .rows=${rows}
      .total=${640}
      has-more
    >
      <div slot="filters">
        <label>
          Search terminals
          <input type="search" placeholder="Serial number or site" />
        </label>
      </div>
    </fluid-infinite-table>
  `
};

export default meta;
type Story = StoryObj;

export const TemplateColumns: Story = {};

export const DocumentScroll: Story = {
  render: () => html`
    <fluid-infinite-table
      caption="Terminal fleet"
      configurable
      .columns=${columns}
      .rows=${rows}
      .total=${80}
    >
      <div slot="filters">Projected filter controls</div>
    </fluid-infinite-table>
  `
};

export const Loading: Story = {
  render: () => html`
    <fluid-infinite-table
      caption="Loading terminals"
      loading
      .columns=${columns}
      .rows=${rows.slice(0, 20)}
      .total=${80}
    ></fluid-infinite-table>
  `
};

export const Empty: Story = {
  render: () => html`
    <fluid-infinite-table
      caption="No matching terminals"
      .columns=${columns}
      .rows=${[]}
    >
      <strong slot="empty">No terminals match these filters</strong>
    </fluid-infinite-table>
  `
};
