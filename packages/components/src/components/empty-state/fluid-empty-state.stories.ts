import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../icon/define.js";

const meta: Meta = {
  title: "Components/Feedback/Empty state",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`
    <fluid-empty-state heading="No projects yet">
      <fluid-icon slot="media" name="folder"></fluid-icon>
      Create your first project to get started.
      <fluid-button slot="actions" variant="primary">New project</fluid-button>
    </fluid-empty-state>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const NoResults: Story = {
  render: () => html`
    <fluid-empty-state heading="No results found">
      <fluid-icon slot="media" name="search"></fluid-icon>
      Try a different search term or clear your filters.
      <fluid-button slot="actions" variant="secondary">Clear filters</fluid-button>
    </fluid-empty-state>
  `
};

export const TextOnly: Story = {
  render: () => html`<fluid-empty-state heading="Inbox zero">You're all caught up.</fluid-empty-state>`
};
