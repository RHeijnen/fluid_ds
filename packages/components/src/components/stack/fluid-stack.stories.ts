import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Layout/Stack",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const box = (label: string) => html`
  <div
    style="
      padding: var(--fluid-space-3) var(--fluid-space-4);
      background: var(--fluid-surface-muted);
      border-radius: var(--fluid-radius-md);
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
    "
  >
    ${label}
  </div>
`;

/** Vertical stack, even rhythm down a column. */
export const Vertical: Story = {
  render: () => html`
    <fluid-stack style="max-width: 16rem;">
      ${box("One")}${box("Two")}${box("Three")}
    </fluid-stack>
  `
};

/** Horizontal row. */
export const Horizontal: Story = {
  render: () => html`
    <fluid-stack direction="horizontal" gap="0.5rem">
      ${box("One")}${box("Two")}${box("Three")}
    </fluid-stack>
  `
};

/** Cluster, a wrapping horizontal group (chips / tags / buttons). */
export const Cluster: Story = {
  render: () => html`
    <fluid-stack direction="horizontal" wrap gap="0.5rem" style="max-width: 22rem;">
      ${["Design", "Engineering", "Marketing", "Sales", "Support", "Finance", "Legal"].map(box)}
    </fluid-stack>
  `
};

/** Justify distributes along the main axis. */
export const Justified: Story = {
  render: () => html`
    <fluid-stack direction="horizontal" justify="between" style="width: 24rem;">
      ${box("Left")}${box("Center")}${box("Right")}
    </fluid-stack>
  `
};
