import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

type Args = { label: string; value: string; change: string; trend: "up" | "down" | "neutral" };

const meta: Meta<Args> = {
  title: "Components/Content/Stat",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    trend: { control: "inline-radio", options: ["up", "down", "neutral"] }
  },
  args: { label: "Revenue", value: "$48.2k", change: "+12%", trend: "up" },
  render: (a) => html`<fluid-stat label=${a.label} value=${a.value} change=${a.change} trend=${a.trend}></fluid-stat>`
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Grid: Story = {
  render: () => html`
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem;">
      <fluid-stat label="Revenue" value="$48.2k" change="+12%" trend="up"></fluid-stat>
      <fluid-stat label="Churn" value="2.1%" change="-0.4pt" trend="down"></fluid-stat>
      <fluid-stat label="Active users" value="9,310" change="0%" trend="neutral"></fluid-stat>
    </div>
  `
};
