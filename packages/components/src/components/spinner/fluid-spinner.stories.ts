import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Feedback/Spinner",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`<fluid-spinner style="font-size: 2rem;"></fluid-spinner>`
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; align-items:center; gap: var(--fluid-space-3);">
      <fluid-spinner></fluid-spinner>
      <fluid-spinner style="font-size: 1.5rem"></fluid-spinner>
      <fluid-spinner style="font-size: 2rem"></fluid-spinner>
      <fluid-spinner style="font-size: 3rem"></fluid-spinner>
    </div>
  `
};

export const Inline: Story = {
  render: () => html`
    <p>Loading data… <fluid-spinner></fluid-spinner></p>
  `
};
