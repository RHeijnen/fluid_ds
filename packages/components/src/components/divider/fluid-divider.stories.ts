import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidDivider } from "./fluid-divider.js";

type Args = Pick<FluidDivider, "orientation">;

const meta: Meta<Args> = {
  title: "Components/Divider",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] }
  },
  args: { orientation: "horizontal" },
  render: (args) => html`
    <div style="display:flex; gap: var(--fluid-space-4); height: 4rem; align-items: center;">
      <span>Before</span>
      <fluid-divider orientation=${args.orientation}></fluid-divider>
      <span>After</span>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Horizontal: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3);">
      <span>Top</span>
      <fluid-divider></fluid-divider>
      <span>Bottom</span>
    </div>
  `
};

export const Vertical: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-4); height: 2rem; align-items: center;">
      <span>Left</span>
      <fluid-divider orientation="vertical"></fluid-divider>
      <span>Middle</span>
      <fluid-divider orientation="vertical"></fluid-divider>
      <span>Right</span>
    </div>
  `
};
