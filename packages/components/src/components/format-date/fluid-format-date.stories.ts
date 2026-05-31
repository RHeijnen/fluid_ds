import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Format/Date",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const sample = "2024-06-15T14:30:00Z";

export const Default: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li>full: <fluid-format-date date=${sample} date-style="full"></fluid-format-date></li>
      <li>long: <fluid-format-date date=${sample} date-style="long"></fluid-format-date></li>
      <li>medium: <fluid-format-date date=${sample} date-style="medium"></fluid-format-date></li>
      <li>short: <fluid-format-date date=${sample} date-style="short"></fluid-format-date></li>
      <li>
        date + time:
        <fluid-format-date date=${sample} date-style="medium" time-style="short"></fluid-format-date>
      </li>
    </ul>
  `
};

export const Locales: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li><fluid-format-date date=${sample} date-style="full" locale="en-US"></fluid-format-date></li>
      <li><fluid-format-date date=${sample} date-style="full" locale="fr-FR"></fluid-format-date></li>
      <li><fluid-format-date date=${sample} date-style="full" locale="ja-JP"></fluid-format-date></li>
      <li><fluid-format-date date=${sample} date-style="full" locale="ar-EG"></fluid-format-date></li>
    </ul>
  `
};
