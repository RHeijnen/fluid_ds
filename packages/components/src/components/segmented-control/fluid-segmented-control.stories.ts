import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Navigation/SegmentedControl",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  render: () => html`
    <fluid-segmented-control value="light" aria-label="Theme">
      <fluid-segment value="light">Light</fluid-segment>
      <fluid-segment value="dark">Dark</fluid-segment>
      <fluid-segment value="system">System</fluid-segment>
    </fluid-segmented-control>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const TwoOptions: Story = {
  render: () => html`
    <fluid-segmented-control value="on" aria-label="State">
      <fluid-segment value="off">Off</fluid-segment>
      <fluid-segment value="on">On</fluid-segment>
    </fluid-segmented-control>
  `
};

export const WithDisabled: Story = {
  render: () => html`
    <fluid-segmented-control value="grid" aria-label="View">
      <fluid-segment value="list">List</fluid-segment>
      <fluid-segment value="grid">Grid</fluid-segment>
      <fluid-segment value="kanban" disabled>Kanban</fluid-segment>
    </fluid-segmented-control>
  `
};
