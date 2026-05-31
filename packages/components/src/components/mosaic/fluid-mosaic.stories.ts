import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Layout/Mosaic",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const tile = (label: string) => html`
  <div
    style="
      display: grid;
      place-items: center;
      height: 100%;
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

/** Mixed tile sizes packing densely (dense auto-flow backfills gaps). */
export const Default: Story = {
  render: () => html`
    <fluid-mosaic cols="4" row-height="7rem">
      <fluid-mosaic-item size="large">${tile("large 2×2")}</fluid-mosaic-item>
      <fluid-mosaic-item size="wide">${tile("wide 2×1")}</fluid-mosaic-item>
      <fluid-mosaic-item>${tile("1×1")}</fluid-mosaic-item>
      <fluid-mosaic-item>${tile("1×1")}</fluid-mosaic-item>
      <fluid-mosaic-item size="tall">${tile("tall 1×2")}</fluid-mosaic-item>
      <fluid-mosaic-item>${tile("1×1")}</fluid-mosaic-item>
      <fluid-mosaic-item size="wide">${tile("wide 2×1")}</fluid-mosaic-item>
      <fluid-mosaic-item>${tile("1×1")}</fluid-mosaic-item>
    </fluid-mosaic>
  `
};

/** Intrinsic columns, tiles reflow as the container resizes. */
export const Intrinsic: Story = {
  render: () => html`
    <fluid-mosaic min-col-width="9rem" row-height="6rem">
      <fluid-mosaic-item size="wide">${tile("wide")}</fluid-mosaic-item>
      <fluid-mosaic-item>${tile("1×1")}</fluid-mosaic-item>
      <fluid-mosaic-item size="tall">${tile("tall")}</fluid-mosaic-item>
      <fluid-mosaic-item>${tile("1×1")}</fluid-mosaic-item>
      <fluid-mosaic-item>${tile("1×1")}</fluid-mosaic-item>
      <fluid-mosaic-item size="large">${tile("large")}</fluid-mosaic-item>
    </fluid-mosaic>
  `
};

/** Explicit col-span / row-span override the size preset. */
export const ExplicitSpans: Story = {
  render: () => html`
    <fluid-mosaic cols="4" row-height="6rem">
      <fluid-mosaic-item col-span="3">${tile("col-span 3")}</fluid-mosaic-item>
      <fluid-mosaic-item row-span="2">${tile("row-span 2")}</fluid-mosaic-item>
      <fluid-mosaic-item col-span="3">${tile("col-span 3")}</fluid-mosaic-item>
    </fluid-mosaic>
  `
};
