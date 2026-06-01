import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Forms/Calendar",
  component: "fluid-calendar",
  argTypes: {
    value: { control: "text" },
    min: { control: "text" },
    max: { control: "text" },
    weekStart: { control: { type: "number", min: 0, max: 6 } },
    range: { control: "boolean" }
  }
};
export default meta;
type Story = StoryObj;

export const Single: Story = {
  args: { value: "2026-06-15", weekStart: 1 },
  render: (a) =>
    html`<fluid-calendar
      .value=${a.value}
      week-start=${a.weekStart}
      style="border:1px solid var(--fluid-border-default); border-radius:0.75rem; padding:0.75rem;"
    ></fluid-calendar>`
};

export const WithMinMax: Story = {
  render: () =>
    html`<fluid-calendar
      value="2026-06-15"
      min="2026-06-05"
      max="2026-06-24"
      style="border:1px solid var(--fluid-border-default); border-radius:0.75rem; padding:0.75rem;"
    ></fluid-calendar>`
};

export const RangePainting: Story = {
  render: () =>
    html`<fluid-calendar
      range
      range-start="2026-06-08"
      range-end="2026-06-19"
      view="2026-06-15"
      style="border:1px solid var(--fluid-border-default); border-radius:0.75rem; padding:0.75rem;"
    ></fluid-calendar>`
};

export const SundayStart: Story = {
  render: () =>
    html`<fluid-calendar
      value="2026-06-15"
      week-start="0"
      style="border:1px solid var(--fluid-border-default); border-radius:0.75rem; padding:0.75rem;"
    ></fluid-calendar>`
};
