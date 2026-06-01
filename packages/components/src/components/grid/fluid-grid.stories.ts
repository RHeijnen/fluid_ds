import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Layout/Grid",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const cell = (label: string) => html`
  <div
    style="
      display: grid;
      place-items: center;
      min-height: 4rem;
      padding: var(--fluid-space-3);
      background: var(--fluid-surface-muted);
      border-radius: var(--fluid-radius-md);
      color: var(--fluid-text-secondary);
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-sm);
    "
  >
    ${label}
  </div>
`;

const cells = (n: number) =>
  Array.from({ length: n }, (_, i) => cell(`Item ${i + 1}`));

/** Intrinsic mode, auto-fills as many columns as fit (resize to see). */
export const Intrinsic: Story = {
  render: () => html`<fluid-grid min-col-width="12rem">${cells(8)}</fluid-grid>`
};

/** Fixed three-column grid. */
export const FixedColumns: Story = {
  render: () => html`<fluid-grid cols="3">${cells(6)}</fluid-grid>`
};

/** Responsive: 1 column on phones, 2 at md, 4 at lg. */
export const Responsive: Story = {
  render: () =>
    html`<fluid-grid cols="1" cols-md="2" cols-lg="4">${cells(8)}</fluid-grid>`
};

/** Spanning cells with <fluid-col>. */
export const Spanning: Story = {
  render: () => html`
    <fluid-grid cols="4">
      <fluid-col span="2">${cell("span 2")}</fluid-col>
      <fluid-col>${cell("1")}</fluid-col>
      <fluid-col>${cell("1")}</fluid-col>
      <fluid-col span="4">${cell("span 4 (full row)")}</fluid-col>
      <fluid-col start="2" span="2">${cell("start 2, span 2")}</fluid-col>
    </fluid-grid>
  `
};

/** Custom gap. */
export const Gap: Story = {
  render: () => html`<fluid-grid cols="3" gap="2rem">${cells(6)}</fluid-grid>`
};
