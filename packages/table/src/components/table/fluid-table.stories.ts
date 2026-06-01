import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidTableColumn, FluidTableRow } from "./fluid-table.js";

const columns: FluidTableColumn[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role", sortable: true },
  { key: "team", label: "Team" },
  { key: "commits", label: "Commits", sortable: true, align: "end" }
];

const rows: FluidTableRow[] = [
  { id: 1, name: "Ada Lovelace", role: "Engineer", team: "Core", commits: 312 },
  { id: 2, name: "Grace Hopper", role: "Architect", team: "Platform", commits: 1290 },
  { id: 3, name: "Alan Turing", role: "Researcher", team: "Core", commits: 87 },
  { id: 4, name: "Katherine Johnson", role: "Analyst", team: "Data", commits: 540 }
];

const meta: Meta = {
  title: "Table/Data table",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`
    <fluid-table
      caption="Contributors"
      .columns=${columns}
      .rows=${rows}
      .sort=${{ key: "commits", dir: "desc" }}
    ></fluid-table>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Sortable: Story = {
  render: () => html`
    <fluid-table caption="Sort any header" .columns=${columns} .rows=${rows}></fluid-table>
  `
};

export const Selectable: Story = {
  render: () => html`
    <fluid-table selectable caption="Pick rows" .columns=${columns} .rows=${rows}></fluid-table>
  `
};

export const HiddenCaption: Story = {
  render: () => html`
    <fluid-table
      hide-caption
      caption="Contributors, screen-reader only"
      .columns=${columns}
      .rows=${rows}
    ></fluid-table>
  `
};

export const Zebra: Story = {
  render: () => html`
    <fluid-table
      caption="Zebra striping via token"
      style="--fluid-table-zebra-bg: #fafafa;"
      .columns=${columns}
      .rows=${rows}
    ></fluid-table>
  `
};
