import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidSwitch } from "./fluid-switch.js";

type Args = Pick<FluidSwitch, "checked" | "disabled" | "required"> & { label: string };

const meta: Meta<Args> = {
  title: "Components/Forms/Switch",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    label: { control: "text" }
  },
  args: {
    checked: false,
    disabled: false,
    required: false,
    label: "Enable notifications"
  },
  render: (args) => html`
    <fluid-switch
      ?checked=${args.checked}
      ?disabled=${args.disabled}
      ?required=${args.required}
    >
      ${args.label}
    </fluid-switch>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const States: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3);">
      <fluid-switch>Off</fluid-switch>
      <fluid-switch checked>On</fluid-switch>
      <fluid-switch disabled>Disabled (off)</fluid-switch>
      <fluid-switch disabled checked>Disabled (on)</fluid-switch>
    </div>
  `
};

export const NoLabel: Story = {
  render: () => html`<fluid-switch aria-label="Toggle"></fluid-switch>`
};
