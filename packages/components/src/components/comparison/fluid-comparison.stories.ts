import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Media/Comparison",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const placeholder = (label: string, color: string) => html`
  <div
    style="
      width: 100%;
      aspect-ratio: 16 / 9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--fluid-font-size-2xl);
      background: ${color};
    "
  >
    ${label}
  </div>
`;

export const Default: Story = {
  render: () => html`
    <fluid-comparison style="max-width: 32rem; border-radius: var(--fluid-radius-lg);">
      <div slot="before">${placeholder("Before", "#475569")}</div>
      <div slot="after">${placeholder("After", "#0ea5e9")}</div>
    </fluid-comparison>
  `
};

export const StartPosition: Story = {
  render: () => html`
    <fluid-comparison position="25" style="max-width: 32rem;">
      <div slot="before">${placeholder("Before", "#4f46e5")}</div>
      <div slot="after">${placeholder("After", "#16a34a")}</div>
    </fluid-comparison>
  `
};
