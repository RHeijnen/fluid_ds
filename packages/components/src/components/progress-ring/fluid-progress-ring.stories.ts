import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidProgressRing } from "./fluid-progress-ring.js";

type Args = Pick<FluidProgressRing, "value" | "showValue">;

const meta: Meta<Args> = {
  title: "Components/ProgressRing",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    showValue: { control: "boolean" }
  },
  args: { value: 60, showValue: true },
  render: (args) => html`
    <fluid-progress-ring
      value=${args.value}
      ?show-value=${args.showValue}
      aria-label="Demo progress"
    ></fluid-progress-ring>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-4); align-items: center;">
      <fluid-progress-ring value="42" show-value aria-label="Small"></fluid-progress-ring>
      <fluid-progress-ring
        value="42"
        show-value
        style="--fluid-progress-ring-size: 5rem"
        aria-label="Medium"
      ></fluid-progress-ring>
      <fluid-progress-ring
        value="42"
        show-value
        style="--fluid-progress-ring-size: 7rem"
        aria-label="Large"
      ></fluid-progress-ring>
    </div>
  `
};
