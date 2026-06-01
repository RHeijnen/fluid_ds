import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Utilities/Bytes",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li>0 B: <fluid-format-bytes value="0"></fluid-format-bytes></li>
      <li>1024: <fluid-format-bytes value="1024"></fluid-format-bytes></li>
      <li>1,234,567: <fluid-format-bytes value="1234567"></fluid-format-bytes></li>
      <li>
        binary 1,234,567:
        <fluid-format-bytes value="1234567" base="binary"></fluid-format-bytes>
      </li>
      <li>
        long: <fluid-format-bytes value="1234567" display="long"></fluid-format-bytes>
      </li>
      <li>bits: <fluid-format-bytes value="125000" unit="bit"></fluid-format-bytes>/s</li>
    </ul>
  `
};

export const Locale: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li>en-US: <fluid-format-bytes value="1234567" locale="en-US"></fluid-format-bytes></li>
      <li>fr-FR: <fluid-format-bytes value="1234567" locale="fr-FR"></fluid-format-bytes></li>
      <li>de-DE: <fluid-format-bytes value="1234567" locale="de-DE"></fluid-format-bytes></li>
    </ul>
  `
};

