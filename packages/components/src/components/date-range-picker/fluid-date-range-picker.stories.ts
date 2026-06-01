import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Forms/Date Range Picker",
  component: "fluid-date-range-picker",
  argTypes: {
    start: { control: "text" },
    end: { control: "text" },
    format: { control: "select", options: ["short", "medium", "long", "numeric", "iso"] },
    noPresets: { control: "boolean" }
  }
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: { start: "2026-06-08", end: "2026-06-19" },
  render: (a) =>
    html`<fluid-date-range-picker
      start=${a.start ?? ""}
      end=${a.end ?? ""}
      format=${a.format ?? "medium"}
      ?no-presets=${a.noPresets}
    ></fluid-date-range-picker>`
};

export const Empty: Story = {
  render: () => html`<fluid-date-range-picker placeholder="Pick a range…"></fluid-date-range-picker>`
};

export const NoPresets: Story = {
  render: () => html`<fluid-date-range-picker start="2026-06-08" end="2026-06-19" no-presets></fluid-date-range-picker>`
};

export const WithMinMax: Story = {
  render: () => html`<fluid-date-range-picker min="2026-06-01" max="2026-07-31" start="2026-06-08" end="2026-06-19"></fluid-date-range-picker>`
};
