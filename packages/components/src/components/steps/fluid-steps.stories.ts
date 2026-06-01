import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidSteps } from "./fluid-steps.js";

type Args = Pick<FluidSteps, "current" | "orientation" | "variant" | "clickable">;

const meta: Meta<Args> = {
  title: "Components/Navigation/Steps",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    current: { control: { type: "number", min: 0, max: 3 } },
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    variant: { control: "inline-radio", options: ["default", "chip"] },
    clickable: { control: "boolean" }
  },
  args: { current: 1, orientation: "horizontal", variant: "default", clickable: false },
  render: (args) => html`
    <fluid-steps
      .current=${args.current}
      orientation=${args.orientation}
      variant=${args.variant}
      ?clickable=${args.clickable}
      aria-label="Checkout progress"
    >
      <fluid-step description="Your details">Account</fluid-step>
      <fluid-step description="Where to ship">Shipping</fluid-step>
      <fluid-step description="How to pay">Payment</fluid-step>
      <fluid-step description="All done">Review</fluid-step>
    </fluid-steps>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: { orientation: "vertical" }
};

export const Clickable: Story = {
  args: { clickable: true }
};

export const FirstStep: Story = {
  args: { current: 0 }
};

export const Complete: Story = {
  args: { current: 4 }
};

export const Chip: Story = {
  args: { variant: "chip" }
};

export const ChipClickable: Story = {
  args: { variant: "chip", clickable: true }
};
