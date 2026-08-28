import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidRangeSlider } from "./fluid-range-slider.js";

type Args = Pick<
  FluidRangeSlider,
  "min" | "max" | "step" | "valueMin" | "valueMax" | "disabled" | "showValue"
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
    disabled: { control: "boolean" },
    showValue: { control: "boolean" }
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    valueMin: 25,
    valueMax: 75,
    disabled: false,
    showValue: true
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
        ?show-value=${args.showValue}
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
  args: { min: 0, max: 1000, step: 10, valueMin: 200, valueMax: 800, showValue: true },
  render: (args) => html`
    <div style="max-width: 360px;">
      <fluid-range-slider
        .min=${args.min}
        .max=${args.max}
        .step=${args.step}
        .valueMin=${args.valueMin}
        .valueMax=${args.valueMax}
        ?disabled=${args.disabled}
        ?show-value=${args.showValue}
        .valueFormatter=${(n: number) => `$${n}`}
      ></fluid-range-slider>
    </div>
  `
};

export const WithDescription: Story = {
  args: { valueMin: 20, valueMax: 80, showValue: true },
  render: (args) => html`
    <fluid-field
      label="Preferred temperature range"
      description="Choose the minimum and maximum temperature for automatic climate control."
      style="max-width:380px;"
    >
      <fluid-range-slider
        .min=${args.min}
        .max=${args.max}
        .step=${args.step}
        .valueMin=${args.valueMin}
        .valueMax=${args.valueMax}
        ?disabled=${args.disabled}
        ?show-value=${args.showValue}
      ></fluid-range-slider>
    </fluid-field>
  `
};

export const InAForm: Story = {
  args: { min: 0, max: 1000, step: 25, valueMin: 200, valueMax: 750, showValue: true },
  render: (args) => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:400px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Monthly budget"
        description="Select the minimum and maximum amount you are comfortable spending."
      >
        <fluid-range-slider
          name="monthly-budget"
          .min=${args.min}
          .max=${args.max}
          .step=${args.step}
          .valueMin=${args.valueMin}
          .valueMax=${args.valueMax}
          ?disabled=${args.disabled}
          ?show-value=${args.showValue}
          .valueFormatter=${(value: number) => `$${value}`}
        ></fluid-range-slider>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Apply budget</fluid-button>
    </form>
  `
};
