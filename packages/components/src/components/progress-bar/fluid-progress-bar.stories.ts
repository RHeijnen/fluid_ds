import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidProgressBar } from "./fluid-progress-bar.js";

type Args = Pick<FluidProgressBar, "value" | "indeterminate" | "showValue"> & {
  label: string;
};

const meta: Meta<Args> = {
  title: "Components/ProgressBar",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    indeterminate: { control: "boolean" },
    showValue: { control: "boolean" }
  },
  args: { value: 60, indeterminate: false, showValue: true, label: "Uploading" },
  render: (args) => html`
    <div style="max-width: 320px;">
      <fluid-progress-bar
        value=${args.value}
        ?indeterminate=${args.indeterminate}
        ?show-value=${args.showValue}
        aria-label=${args.label}
      >
        ${args.label}
      </fluid-progress-bar>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Indeterminate: Story = {
  args: { indeterminate: true, value: null as never, showValue: false }
};

export const Stages: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width:320px;">
      ${[0, 25, 50, 75, 100].map(
        (v) => html`
          <fluid-progress-bar value=${v} show-value aria-label=${`Progress ${v}%`}>
            ${v}%
          </fluid-progress-bar>
        `
      )}
    </div>
  `
};
