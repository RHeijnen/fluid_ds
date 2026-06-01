import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Utilities/Relative time",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const future = (ms: number) => new Date(Date.now() + ms).toISOString();

export const Default: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li>30s ago: <fluid-relative-time date=${ago(30 * 1000)}></fluid-relative-time></li>
      <li>5m ago: <fluid-relative-time date=${ago(5 * 60 * 1000)}></fluid-relative-time></li>
      <li>3h ago: <fluid-relative-time date=${ago(3 * 60 * 60 * 1000)}></fluid-relative-time></li>
      <li>
        yesterday:
        <fluid-relative-time date=${ago(24 * 60 * 60 * 1000)}></fluid-relative-time>
      </li>
      <li>
        in 2 hours: <fluid-relative-time date=${future(2 * 60 * 60 * 1000)}></fluid-relative-time>
      </li>
      <li>
        in 3 weeks:
        <fluid-relative-time date=${future(3 * 7 * 24 * 60 * 60 * 1000)}></fluid-relative-time>
      </li>
    </ul>
  `
};

export const Locales: Story = {
  render: () => html`
    <ul style="line-height: 1.8;">
      <li>
        en-US:
        <fluid-relative-time date=${ago(2 * 60 * 60 * 1000)} locale="en-US"></fluid-relative-time>
      </li>
      <li>
        fr-FR:
        <fluid-relative-time date=${ago(2 * 60 * 60 * 1000)} locale="fr-FR"></fluid-relative-time>
      </li>
      <li>
        de-DE:
        <fluid-relative-time date=${ago(2 * 60 * 60 * 1000)} locale="de-DE"></fluid-relative-time>
      </li>
    </ul>
  `
};
