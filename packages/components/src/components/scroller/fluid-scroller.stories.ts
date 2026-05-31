import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Layout/Scroller",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const tiles = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => html`
      <div
        style="display:inline-block; width: 8rem; height: 6rem; margin-right: var(--fluid-space-2); background: var(--fluid-surface-muted); border-radius: var(--fluid-radius-md); padding: var(--fluid-space-2);"
      >
        Tile ${i + 1}
      </div>
    `
  );

export const Horizontal: Story = {
  render: () => html`
    <fluid-scroller style="max-width: 24rem; height: 7rem;"> ${tiles(12)} </fluid-scroller>
  `
};

export const Vertical: Story = {
  render: () => html`
    <fluid-scroller orientation="vertical" style="height: 12rem; max-width: 20rem;">
      ${Array.from(
        { length: 30 },
        (_, i) => html`
          <div
            style="padding: var(--fluid-space-2); border-bottom: 1px solid var(--fluid-border-default);"
          >
            Row ${i + 1}
          </div>
        `
      )}
    </fluid-scroller>
  `
};

export const NoScrollbar: Story = {
  render: () => html`
    <fluid-scroller no-scrollbar style="max-width: 24rem; height: 7rem;">
      ${tiles(10)}
    </fluid-scroller>
  `
};
