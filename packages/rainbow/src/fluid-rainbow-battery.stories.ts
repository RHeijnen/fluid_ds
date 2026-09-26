import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Rainbow/Battery",
  tags: ["autodocs"],
  parameters: { status: { type: "beta" } }
};

export default meta;
type Story = StoryObj;

/** Levels, with the value shown next to the label. */
export const Levels: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; flex-wrap: wrap">
      <fluid-rainbow-battery value="95" show-value>Battery</fluid-rainbow-battery>
      <fluid-rainbow-battery value="40" show-value>Storage</fluid-rainbow-battery>
      <fluid-rainbow-battery value="8" show-value>Quota</fluid-rainbow-battery>
    </div>
  `
};

/** Charging adds the cord and smiling plug; pulse adds the heartbeat trace. */
export const ChargingWithPulse: Story = {
  render: () => html`
    <fluid-rainbow-battery value="99.98" show-value charging pulse>Uptime</fluid-rainbow-battery>
  `
};
