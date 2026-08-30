import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../checkbox/define.js";
import "../field/define.js";
import "../input/define.js";
import "../radio/define.js";
import type { FluidFieldset } from "./fluid-fieldset.js";

type Args = Pick<FluidFieldset, "legend" | "description" | "error" | "disabled">;

const meta: Meta<Args> = {
  title: "Components/Forms/Fieldset",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
  argTypes: {
    legend: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" }
  },
  args: {
    legend: "Contact details",
    description: "We will only use this to reach you about your order.",
    error: "",
    disabled: false
  },
  render: (args) => html`
    <fluid-fieldset
      legend=${args.legend}
      description=${args.description}
      error=${args.error}
      ?disabled=${args.disabled}
      style="max-width: 24rem;"
    >
      <fluid-field label="Email" for="fieldset-email">
        <fluid-input id="fieldset-email" type="email" name="email"></fluid-input>
      </fluid-field>
      <fluid-field label="Phone" for="fieldset-phone">
        <fluid-input id="fieldset-phone" type="tel" name="phone"></fluid-input>
      </fluid-field>
    </fluid-fieldset>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    legend: "Shipping address",
    description: "Where should we send your package?",
    error: "Please complete every required field."
  }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const LegendSlot: Story = {
  render: () => html`
    <fluid-fieldset style="max-width: 24rem;">
      <span slot="legend">Notification preferences</span>
      <fluid-checkbox name="email-updates">Email updates</fluid-checkbox>
      <fluid-checkbox name="sms-updates">SMS updates</fluid-checkbox>
    </fluid-fieldset>
  `
};

export const RadioGroup: Story = {
  render: () => html`
    <fluid-fieldset
      legend="Plan"
      description="Pick the plan that fits your team."
      style="max-width: 24rem;"
    >
      <fluid-radio-group name="plan" value="free" aria-label="Plan">
        <fluid-radio value="free">Free</fluid-radio>
        <fluid-radio value="pro">Pro</fluid-radio>
        <fluid-radio value="team">Team</fluid-radio>
      </fluid-radio-group>
    </fluid-fieldset>
  `
};
