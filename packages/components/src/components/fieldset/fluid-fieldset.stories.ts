import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidFieldset } from "./fluid-fieldset.js";

type Args = Pick<FluidFieldset, "legend" | "description" | "error" | "disabled">;

const meta: Meta<Args> = {
  title: "Components/Forms/Fieldset",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
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
      <label style="display:flex; flex-direction:column; gap:0.25rem;">
        <span>Email</span>
        <input type="email" name="email" />
      </label>
      <label style="display:flex; flex-direction:column; gap:0.25rem;">
        <span>Phone</span>
        <input type="tel" name="phone" />
      </label>
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
      <label style="display:flex; gap:0.5rem; align-items:center;">
        <input type="checkbox" name="email-updates" /> Email updates
      </label>
      <label style="display:flex; gap:0.5rem; align-items:center;">
        <input type="checkbox" name="sms-updates" /> SMS updates
      </label>
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
      <label style="display:flex; gap:0.5rem; align-items:center;">
        <input type="radio" name="plan" value="free" checked /> Free
      </label>
      <label style="display:flex; gap:0.5rem; align-items:center;">
        <input type="radio" name="plan" value="pro" /> Pro
      </label>
      <label style="display:flex; gap:0.5rem; align-items:center;">
        <input type="radio" name="plan" value="team" /> Team
      </label>
    </fluid-fieldset>
  `
};
