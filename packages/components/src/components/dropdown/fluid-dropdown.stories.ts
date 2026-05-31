import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";

const meta: Meta = {
  title: "Components/Dropdown",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <div style="padding: 4rem;">
      <fluid-dropdown>
        <fluid-button slot="trigger">Actions</fluid-button>
        <fluid-dropdown-item value="edit">Edit</fluid-dropdown-item>
        <fluid-dropdown-item value="duplicate">Duplicate</fluid-dropdown-item>
        <fluid-dropdown-item value="share">Share…</fluid-dropdown-item>
        <fluid-dropdown-item type="separator"></fluid-dropdown-item>
        <fluid-dropdown-item value="delete">Delete</fluid-dropdown-item>
      </fluid-dropdown>
    </div>
  `
};

export const WithShortcuts: Story = {
  render: () => html`
    <div style="padding: 4rem;">
      <fluid-dropdown>
        <fluid-button slot="trigger" variant="secondary">File</fluid-button>
        <fluid-dropdown-item value="new">
          New
          <span slot="suffix">⌘N</span>
        </fluid-dropdown-item>
        <fluid-dropdown-item value="open">
          Open…
          <span slot="suffix">⌘O</span>
        </fluid-dropdown-item>
        <fluid-dropdown-item value="save">
          Save
          <span slot="suffix">⌘S</span>
        </fluid-dropdown-item>
      </fluid-dropdown>
    </div>
  `
};

export const Checkboxes: Story = {
  render: () => html`
    <div style="padding: 4rem;">
      <fluid-dropdown>
        <fluid-button slot="trigger" variant="secondary">View options</fluid-button>
        <fluid-dropdown-item type="checkbox" value="grid" checked>Show grid</fluid-dropdown-item>
        <fluid-dropdown-item type="checkbox" value="ruler">Show ruler</fluid-dropdown-item>
        <fluid-dropdown-item type="checkbox" value="snap" checked>Snap to grid</fluid-dropdown-item>
      </fluid-dropdown>
    </div>
  `
};
