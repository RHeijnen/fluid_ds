import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Layout/Split panel",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const block = (label: string) => html`
  <div
    style="padding: var(--fluid-space-4); height: 100%; background: var(--fluid-surface-muted);"
  >
    ${label}
  </div>
`;

export const Default: Story = {
  render: () => html`
    <fluid-split-panel
      style="height: 16rem; border: 1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md);"
    >
      <div slot="start">${block("Start panel")}</div>
      <div slot="end">${block("End panel")}</div>
    </fluid-split-panel>
  `
};

export const Vertical: Story = {
  render: () => html`
    <fluid-split-panel
      orientation="vertical"
      position="35"
      style="height: 18rem; border: 1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md);"
    >
      <div slot="start">${block("Top panel")}</div>
      <div slot="end">${block("Bottom panel")}</div>
    </fluid-split-panel>
  `
};

export const Clamped: Story = {
  render: () => html`
    <fluid-split-panel
      min-position="20"
      max-position="80"
      style="height: 14rem; border: 1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md);"
    >
      <div slot="start">${block("Min 20%")}</div>
      <div slot="end">${block("Max 80%")}</div>
    </fluid-split-panel>
  `
};
