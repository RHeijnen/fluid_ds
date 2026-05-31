import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Format/Number",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Decimal: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li><fluid-format-number value="1234567.89"></fluid-format-number></li>
      <li><fluid-format-number value="1234567.89" no-grouping></fluid-format-number></li>
      <li>
        <fluid-format-number
          value="3.14159"
          maximum-fraction-digits="3"
        ></fluid-format-number>
      </li>
    </ul>
  `
};

export const Currency: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li><fluid-format-number value="1234.5" type="currency" currency="USD"></fluid-format-number></li>
      <li><fluid-format-number value="1234.5" type="currency" currency="EUR" locale="de-DE"></fluid-format-number></li>
      <li>
        <fluid-format-number
          value="1234.5"
          type="currency"
          currency="JPY"
          locale="ja-JP"
        ></fluid-format-number>
      </li>
    </ul>
  `
};

export const Percent: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li><fluid-format-number value="0.123" type="percent"></fluid-format-number></li>
      <li>
        <fluid-format-number
          value="0.987"
          type="percent"
          minimum-fraction-digits="2"
        ></fluid-format-number>
      </li>
    </ul>
  `
};

export const Unit: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li><fluid-format-number value="85" type="unit" unit="kilometer-per-hour"></fluid-format-number></li>
      <li>
        <fluid-format-number value="2.5" type="unit" unit="liter" unit-display="long"></fluid-format-number>
      </li>
    </ul>
  `
};
