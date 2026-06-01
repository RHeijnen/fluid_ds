import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidLoadingOverlay } from "./fluid-loading-overlay.js";

type Args = Pick<FluidLoadingOverlay, "active" | "label">;

const panel = html`
  <div
    style="
      width: 320px;
      padding: var(--fluid-space-5);
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-md);
      background: var(--fluid-surface-base);
      color: var(--fluid-text-primary);
    "
  >
    <h3 style="margin: 0 0 var(--fluid-space-2);">Account summary</h3>
    <p style="margin: 0 0 var(--fluid-space-3); color: var(--fluid-text-secondary);">
      Your balance and recent activity load here. While the overlay is active
      this content is dimmed and cannot be clicked.
    </p>
    <button type="button">View details</button>
  </div>
`;

const meta: Meta<Args> = {
  title: "Components/Feedback/Loading overlay",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    active: { control: "boolean" },
    label: { control: "text" }
  },
  args: { active: true, label: "Loading account…" },
  render: (args) => html`
    <fluid-loading-overlay ?active=${args.active} label=${args.label}>
      ${panel}
    </fluid-loading-overlay>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: { active: true, label: "Fetching transactions…" }
};

export const NoLabel: Story = {
  args: { active: true, label: "" }
};

export const Inactive: Story = {
  args: { active: false, label: "Loading account…" }
};
