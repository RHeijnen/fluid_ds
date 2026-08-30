import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidRadioGroup } from "./fluid-radio-group.js";

type Args = Pick<FluidRadioGroup, "value" | "orientation" | "required">;

const meta: Meta<Args> = {
  title: "Components/Forms/Radio",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
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
  parameters: { controls: { disable: true } },
  render: () => html`
    <fluid-radio-group value="weekly" aria-label="Frequency">
      <span slot="label">Frequency</span>
      <fluid-radio value="daily">Daily</fluid-radio>
      <fluid-radio value="weekly">Weekly</fluid-radio>
      <fluid-radio value="monthly" disabled>Monthly (coming soon)</fluid-radio>
    </fluid-radio-group>
  `
};

export const WithDescription: Story = {
  args: { value: "standard", orientation: "vertical" },
  render: (args) => html`
    <fluid-field
      label="Delivery speed"
      description="Choose how quickly you would like the order to arrive."
      ?required=${args.required}
    >
      <fluid-radio-group
        .value=${args.value}
        orientation=${args.orientation}
        ?required=${args.required}
        aria-label="Delivery speed"
      >
        <fluid-radio value="standard">Standard — 3–5 business days</fluid-radio>
        <fluid-radio value="express">Express — next business day</fluid-radio>
        <fluid-radio value="pickup">Store pickup</fluid-radio>
      </fluid-radio-group>
    </fluid-field>
  `
};

export const InAForm: Story = {
  args: { value: "", orientation: "vertical", required: true },
  render: (args) => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:420px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Contact preference"
        description="Select the best way for us to contact you."
        ?required=${args.required}
      >
        <fluid-radio-group
          name="contact-preference"
          .value=${args.value}
          orientation=${args.orientation}
          ?required=${args.required}
          aria-label="Contact preference"
          @invalid=${(event: Event) => {
            const control = event.currentTarget as FluidRadioGroup;
            const field = control.closest("fluid-field") as HTMLElement & { error: string };
            field.error = control.validationMessage;
          }}
          @fluid-change=${(event: Event) => {
            const control = event.currentTarget as FluidRadioGroup;
            const field = control.closest("fluid-field") as HTMLElement & { error: string };
            if (control.validity.valid) field.error = "";
          }}
        >
          <fluid-radio value="email">Email</fluid-radio>
          <fluid-radio value="phone">Phone</fluid-radio>
          <fluid-radio value="text">Text message</fluid-radio>
        </fluid-radio-group>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Continue</fluid-button>
    </form>
  `
};
