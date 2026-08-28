import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../bar-chart/define.js";
import "../line-chart/define.js";
import "../pie-chart/define.js";
import "../doughnut-chart/define.js";
import "../scatter-chart/define.js";
import "../bubble-chart/define.js";
import "../radar-chart/define.js";
import "../polar-area-chart/define.js";
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

/** The generic chart is a public element, separate from the typed wrappers. */
export const Generic: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 32rem;">
      <fluid-chart
        type="bar"
        label="Monthly signups"
        .data=${{
          labels: months,
          datasets: [{ label: "Signups", data: [120, 190, 150, 220, 280, 240] }]
        }}
      ></fluid-chart>
    </div>
  `
};

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

export const Scatter: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 32rem;">
      <fluid-scatter-chart
        .data=${{
          datasets: [
            {
              label: "Sessions",
              data: [
                { x: 12, y: 19 },
                { x: 18, y: 24 },
                { x: 24, y: 14 },
                { x: 31, y: 36 },
                { x: 36, y: 28 },
                { x: 42, y: 41 }
              ]
            }
          ]
        }}
      ></fluid-scatter-chart>
    </div>
  `
};

export const Bubble: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 32rem;">
      <fluid-bubble-chart
        .data=${{
          datasets: [
            {
              label: "Accounts",
              data: [
                { x: 12, y: 19, r: 8 },
                { x: 18, y: 24, r: 14 },
                { x: 24, y: 14, r: 6 },
                { x: 31, y: 36, r: 18 },
                { x: 36, y: 28, r: 10 }
              ]
            }
          ]
        }}
      ></fluid-bubble-chart>
    </div>
  `
};

export const Radar: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 22rem;">
      <fluid-radar-chart
        .data=${{
          labels: ["Speed", "Reliability", "Comfort", "Safety", "Efficiency", "Price"],
          datasets: [{ label: "Model A", data: [65, 80, 70, 90, 60, 75] }]
        }}
      ></fluid-radar-chart>
    </div>
  `
};

export const PolarArea: Story = {
  render: () => html`
    <div style="height: 16rem; max-width: 22rem;">
      <fluid-polar-area-chart
        .data=${{
          labels: ["Direct", "Referral", "Social", "Email", "Organic"],
          datasets: [{ data: [38, 24, 22, 16, 30] }]
        }}
      ></fluid-polar-area-chart>
    </div>
  `
};

export const Sparkline: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <strong style="font-size: 1.5rem;">$48.2k</strong>
      <fluid-sparkline
        .values=${[12, 15, 10, 18, 22, 19, 25, 28, 26, 32, 30, 35]}
      ></fluid-sparkline>
    </div>
  `
};
