import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../input/define.js";

const meta: Meta = {
  title: "Components/Navigation/Popover",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <div style="padding: 4rem;">
      <fluid-popover placement="bottom-start" distance="8">
        <fluid-button slot="trigger">Open popover</fluid-button>
        <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); min-width: 16rem;">
          <strong>Settings</strong>
          <fluid-input aria-label="Name" placeholder="Your name"></fluid-input>
          <fluid-button>Save</fluid-button>
        </div>
      </fluid-popover>
    </div>
  `
};

export const RichContent: Story = {
  render: () => html`
    <div style="padding: 4rem;">
      <fluid-popover>
        <fluid-button slot="trigger" variant="secondary">User menu</fluid-button>
        <div style="display:flex; flex-direction:column; gap: var(--fluid-space-2); min-width: 14rem;">
          <strong>Hi, Ada</strong>
          <a href="#" style="color: var(--fluid-text-primary); text-decoration: none;">Profile</a>
          <a href="#" style="color: var(--fluid-text-primary); text-decoration: none;">Settings</a>
          <a href="#" style="color: var(--fluid-text-primary); text-decoration: none;">Sign out</a>
        </div>
      </fluid-popover>
    </div>
  `
};
