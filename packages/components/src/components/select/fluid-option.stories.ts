import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidOption } from "./fluid-option.js";

type Args = Pick<FluidOption, "value" | "active" | "selected" | "disabled"> & {
  label: string;
};

const meta: Meta<Args> = {
  title: "Components/Forms/Option",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    label: { control: "text" },
    value: { control: "text" },
    active: { control: "boolean" },
    selected: { control: "boolean" },
    disabled: { control: "boolean" }
  },
  args: {
    label: "Netherlands",
    value: "nl",
    active: false,
    selected: false,
    disabled: false
  },
  render: (args) => renderOption(args)
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true }
};

export const Active: Story = {
  args: { active: true }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const LongLabel: Story = {
  args: {
    label: "United Kingdom of Great Britain and Northern Ireland"
  }
};

export const StateComparison: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; gap:var(--fluid-space-3); max-width:320px;">
      ${renderOption({
        label: "Default",
        value: "default",
        active: false,
        selected: false,
        disabled: false
      })}
      ${renderOption({
        label: "Keyboard active",
        value: "active",
        active: true,
        selected: false,
        disabled: false
      })}
      ${renderOption({
        label: "Selected",
        value: "selected",
        active: false,
        selected: true,
        disabled: false
      })}
      ${renderOption({
        label: "Disabled",
        value: "disabled",
        active: false,
        selected: false,
        disabled: true
      })}
    </div>
  `
};

function renderOption(args: Args) {
  return html`
    <div
      role="listbox"
      aria-label="Country options"
      style="box-sizing:border-box; width:320px; padding:var(--fluid-space-1); background:var(--fluid-surface-base); border:1px solid var(--fluid-border-default); border-radius:var(--fluid-radius-md);"
    >
      <fluid-option
        .value=${args.value}
        ?active=${args.active}
        ?selected=${args.selected}
        ?disabled=${args.disabled}
        >${args.label}</fluid-option
      >
    </div>
  `;
}
