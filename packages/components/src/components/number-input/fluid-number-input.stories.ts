import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidNumberInput } from "./fluid-number-input.js";

type Args = Pick<
  FluidNumberInput,
  "value" | "min" | "max" | "step" | "placeholder" | "noSteppers" | "disabled"
>;

const meta: Meta<Args> = {
  title: "Components/Forms/NumberInput",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    value: { control: "text" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    noSteppers: { control: "boolean" },
    disabled: { control: "boolean" }
  },
  args: {
    value: "5",
    min: 0,
    max: 100,
    step: 1,
    placeholder: "Quantity",
    noSteppers: false,
    disabled: false
  },
  render: (args) => html`
    <div style="max-width: 200px;">
      <fluid-number-input
        aria-label="Quantity"
        .value=${args.value}
        .min=${args.min}
        .max=${args.max}
        .step=${args.step}
        placeholder=${args.placeholder}
        ?no-steppers=${args.noSteppers}
        ?disabled=${args.disabled}
      ></fluid-number-input>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithoutSteppers: Story = {
  args: { noSteppers: true }
};

export const Bounded: Story = {
  args: { min: 1, max: 10, value: "5" }
};
