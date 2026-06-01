import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidRadioGroup } from "./fluid-radio-group.js";

type Args = Pick<FluidRadioGroup, "value" | "orientation" | "required">;

const meta: Meta<Args> = {
  title: "Components/Forms/Radio",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    value: { control: "text" },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    required: { control: "boolean" }
  },
  args: { value: "md", orientation: "vertical", required: false },
  render: (args) => html`
    <fluid-radio-group
      .value=${args.value}
      orientation=${args.orientation}
      ?required=${args.required}
      aria-label="Size"
    >
      <span slot="label">Pick a size</span>
      <fluid-radio value="sm">Small</fluid-radio>
      <fluid-radio value="md">Medium</fluid-radio>
      <fluid-radio value="lg">Large</fluid-radio>
    </fluid-radio-group>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Vertical: Story = {};

export const Horizontal: Story = {
  args: { orientation: "horizontal" }
};

export const WithDisabled: Story = {
  render: () => html`
    <fluid-radio-group value="weekly" aria-label="Frequency">
      <span slot="label">Frequency</span>
      <fluid-radio value="daily">Daily</fluid-radio>
      <fluid-radio value="weekly">Weekly</fluid-radio>
      <fluid-radio value="monthly" disabled>Monthly (coming soon)</fluid-radio>
    </fluid-radio-group>
  `
};
