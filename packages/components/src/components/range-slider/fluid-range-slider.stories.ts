import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidRangeSlider } from "./fluid-range-slider.js";

type Args = Pick<
  FluidRangeSlider,
  "min" | "max" | "step" | "valueMin" | "valueMax" | "disabled"
>;

const meta: Meta<Args> = {
  title: "Components/Forms/Range slider",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    valueMin: { control: "number" },
    valueMax: { control: "number" },
    disabled: { control: "boolean" }
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    valueMin: 25,
    valueMax: 75,
    disabled: false
  },
  render: (args) => html`
    <div style="max-width: 360px;">
      <fluid-range-slider
        .min=${args.min}
        .max=${args.max}
        .step=${args.step}
        .valueMin=${args.valueMin}
        .valueMax=${args.valueMax}
        ?disabled=${args.disabled}
      ></fluid-range-slider>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Narrow: Story = {
  args: { valueMin: 40, valueMax: 60 }
};

export const NegativeRange: Story = {
  args: { min: -50, max: 50, step: 5, valueMin: -20, valueMax: 30 }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const PriceRange: Story = {
  render: () => html`
    <div style="max-width: 360px;">
      <fluid-range-slider
        min="0"
        max="1000"
        step="10"
        value-min="200"
        value-max="800"
        .valueFormatter=${(n: number) => `$${n}`}
      ></fluid-range-slider>
    </div>
  `
};
