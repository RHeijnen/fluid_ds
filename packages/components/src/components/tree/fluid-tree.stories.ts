import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Navigation/Tree",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <fluid-tree style="max-width: 18rem;">
      <fluid-tree-item expanded>
        Documents
        <fluid-tree-item>Resume.pdf</fluid-tree-item>
        <fluid-tree-item>
          Reports
          <fluid-tree-item>Q1.xlsx</fluid-tree-item>
          <fluid-tree-item>Q2.xlsx</fluid-tree-item>
        </fluid-tree-item>
        <fluid-tree-item>Notes.md</fluid-tree-item>
      </fluid-tree-item>
      <fluid-tree-item>
        Pictures
        <fluid-tree-item>vacation.jpg</fluid-tree-item>
        <fluid-tree-item>family.jpg</fluid-tree-item>
      </fluid-tree-item>
      <fluid-tree-item>Music</fluid-tree-item>
    </fluid-tree>
  `
};

export const WithSelected: Story = {
  render: () => html`
    <fluid-tree selected="b" style="max-width: 18rem;">
      <fluid-tree-item id="a" expanded>
        Group A
        <fluid-tree-item id="b">Item B (preselected)</fluid-tree-item>
        <fluid-tree-item id="c">Item C</fluid-tree-item>
      </fluid-tree-item>
      <fluid-tree-item id="d">Item D</fluid-tree-item>
    </fluid-tree>
  `
};
