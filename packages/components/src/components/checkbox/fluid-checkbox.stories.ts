import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidCheckbox } from "./fluid-checkbox.js";

type Args = Pick<FluidCheckbox, "checked" | "indeterminate" | "disabled" | "required"> & {
  label: string;
};

const meta: Meta<Args> = {
  title: "Components/Checkbox",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    checked: { control: "boolean" },
    indeterminate: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" }
  },
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
    label: "I agree to the terms"
  },
  render: (args) => html`
    <fluid-checkbox
      ?checked=${args.checked}
      ?indeterminate=${args.indeterminate}
      ?disabled=${args.disabled}
      ?required=${args.required}
    >
      ${args.label}
    </fluid-checkbox>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const States: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3);">
      <fluid-checkbox>Unchecked</fluid-checkbox>
      <fluid-checkbox checked>Checked</fluid-checkbox>
      <fluid-checkbox indeterminate>Indeterminate</fluid-checkbox>
      <fluid-checkbox disabled>Disabled</fluid-checkbox>
      <fluid-checkbox disabled checked>Disabled (checked)</fluid-checkbox>
    </div>
  `
};

export const PartialSelection: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-2);">
      <fluid-checkbox indeterminate>All items</fluid-checkbox>
      <div style="display:flex; flex-direction:column; gap: var(--fluid-space-2); padding-left: 1.5rem;">
        <fluid-checkbox checked>Apple</fluid-checkbox>
        <fluid-checkbox>Banana</fluid-checkbox>
        <fluid-checkbox checked>Cherry</fluid-checkbox>
      </div>
    </div>
  `
};
