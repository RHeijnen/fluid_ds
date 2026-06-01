import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "../bar-chart/define.js";
import "../line-chart/define.js";
import "../pie-chart/define.js";
import "../doughnut-chart/define.js";
import "../sparkline/define.js";

/**
 * `@fluid-ds/charts` is the charting expansion pack: themeable Chart.js wrappers
 * (`fluid-bar-chart`, `fluid-line-chart`, `fluid-pie-chart`, and friends) plus a
 * compact `fluid-sparkline`.
 */
const meta: Meta = {
  title: "Charts/Gallery",
  parameters: { status: { type: "beta" } }
};
export default meta;

type Story = StoryObj;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export const Bar: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 32rem;">
      <fluid-bar-chart
        .data=${{
          labels: months,
          datasets: [{ label: "Signups", data: [120, 190, 150, 220, 280, 240] }]
        }}
      ></fluid-bar-chart>
    </div>
  `
};

export const Line: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 32rem;">
      <fluid-line-chart
        .data=${{
          labels: months,
          datasets: [{ label: "Revenue", data: [12, 19, 14, 24, 31, 36] }]
        }}
      ></fluid-line-chart>
    </div>
  `
};

export const Pie: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 22rem;">
      <fluid-pie-chart
        .data=${{
          labels: ["Direct", "Referral", "Social", "Email"],
          datasets: [{ data: [38, 24, 22, 16] }]
        }}
      ></fluid-pie-chart>
    </div>
  `
};

export const Doughnut: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 22rem;">
      <fluid-doughnut-chart
        .data=${{
          labels: ["Open", "In progress", "Done"],
          datasets: [{ data: [12, 7, 24] }]
        }}
      ></fluid-doughnut-chart>
    </div>
  `
};

export const Sparkline: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <strong style="font-size: 1.5rem;">$48.2k</strong>
      <fluid-sparkline .values=${[12, 15, 10, 18, 22, 19, 25, 28, 26, 32, 30, 35]}></fluid-sparkline>
    </div>
  `
};
