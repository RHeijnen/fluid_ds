import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidMeter } from "./fluid-meter.js";

type Args = Pick<
  FluidMeter,
  "value" | "min" | "max" | "low" | "high" | "optimum" | "showValue"
> & {
  label: string;
};

const meta: Meta<Args> = {
  title: "Components/Feedback/Meter",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    min: { control: "number" },
    max: { control: "number" },
    low: { control: "number" },
    high: { control: "number" },
    optimum: { control: "number" },
    showValue: { control: "boolean" }
  },
  args: {
    value: 72,
    min: 0,
    max: 100,
    low: 33,
    high: 66,
    optimum: 80,
    showValue: true,
    label: "Disk usage"
  },
  render: (args) => html`
    <div style="max-width: 320px;">
      <fluid-meter
        value=${args.value}
        min=${args.min}
        max=${args.max}
        low=${args.low}
        high=${args.high}
        optimum=${args.optimum}
        ?show-value=${args.showValue}
        label=${args.label}
      >
        ${args.label}
      </fluid-meter>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

/** No banding: a plain gauge using the accent fill. */
export const Plain: Story = {
  args: { low: undefined as never, high: undefined as never, optimum: undefined as never },
  render: (args) => html`
    <div style="max-width: 320px;">
      <fluid-meter value=${args.value} show-value label="Relevance">Relevance</fluid-meter>
    </div>
  `
};

/** The three bands at once: poor (high band, optimum low), fair, and good. */
export const Bands: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-4); max-width:320px;">
      <fluid-meter value="20" low="33" high="66" optimum="90" show-value label="Storage 20">
        Low fuel
      </fluid-meter>
      <fluid-meter value="50" low="33" high="66" optimum="90" show-value label="Storage 50">
        Half full
      </fluid-meter>
      <fluid-meter value="85" low="33" high="66" optimum="90" show-value label="Storage 85">
        Healthy
      </fluid-meter>
    </div>
  `
};

/** Optimum at the LOW end: low values are good, high values are the worst band. */
export const OptimumLow: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-4); max-width:320px;">
      <fluid-meter value="15" low="40" high="75" optimum="10" show-value label="CPU 15">
        CPU 15%
      </fluid-meter>
      <fluid-meter value="55" low="40" high="75" optimum="10" show-value label="CPU 55">
        CPU 55%
      </fluid-meter>
      <fluid-meter value="90" low="40" high="75" optimum="10" show-value label="CPU 90">
        CPU 90%
      </fluid-meter>
    </div>
  `
};

/** Custom range and a value formatter. */
export const CustomRange: Story = {
  render: () => html`
    <div style="max-width: 320px;">
      <fluid-meter
        value="6.2"
        min="0"
        max="8"
        low="2"
        high="6"
        optimum="3"
        show-value
        label="Battery voltage"
        .valueFormatter=${(v: number) => `${v.toFixed(1)} V`}
      >
        Battery voltage
      </fluid-meter>
    </div>
  `
};
