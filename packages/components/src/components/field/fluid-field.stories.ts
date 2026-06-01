import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../input/define.js";
import type { FluidField } from "./fluid-field.js";

type Args = Pick<FluidField, "label" | "description" | "error" | "required" | "for">;

const meta: Meta<Args> = {
  title: "Components/Forms/Field",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    required: { control: "boolean" },
    for: { control: "text" }
  },
  args: {
    label: "Email",
    description: "We'll never share it.",
    error: "",
    required: false,
    for: "email"
  },
  render: (args) => html`
    <fluid-field
      label=${args.label}
      description=${args.description}
      error=${args.error}
      ?required=${args.required}
      for=${args.for ?? ""}
      style="max-width: 22rem;"
    >
      <fluid-input id="email" type="email" placeholder="you@example.com"></fluid-input>
    </fluid-field>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true }
};

export const WithDescription: Story = {
  args: { description: "Use the address you sign in with." }
};

export const WithError: Story = {
  args: {
    error: "Enter a valid email address.",
    description: "We'll never share it."
  }
};

export const NoDescription: Story = {
  args: { description: "" }
};

export const RichSlots: Story = {
  render: () => html`
    <fluid-field for="pw" required style="max-width: 22rem;">
      <span slot="label">Password</span>
      <span slot="description">At least 12 characters.</span>
      <fluid-input id="pw" type="password"></fluid-input>
      <span slot="error">Too short.</span>
    </fluid-field>
  `
};

export const Composed: Story = {
  render: () => html`
    <form style="display:flex; flex-direction:column; gap: var(--fluid-space-4); max-width: 22rem;">
      <fluid-field label="Full name" for="name" required>
        <fluid-input id="name"></fluid-input>
      </fluid-field>
      <fluid-field label="Email" for="email2" description="We'll send a confirmation here.">
        <fluid-input id="email2" type="email"></fluid-input>
      </fluid-field>
      <fluid-field label="Phone" for="phone" error="Enter a valid phone number.">
        <fluid-input id="phone" type="tel" value="abc"></fluid-input>
      </fluid-field>
    </form>
  `
};
