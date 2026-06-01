import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import type { FluidPopconfirm } from "./fluid-popconfirm.js";

type Args = Pick<
  FluidPopconfirm,
  "message" | "confirmText" | "cancelText" | "tone" | "placement" | "disabled"
>;

const meta: Meta<Args> = {
  title: "Components/Feedback/Popconfirm",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    message: { control: "text" },
    confirmText: { control: "text" },
    cancelText: { control: "text" },
    tone: { control: "inline-radio", options: ["danger", "warning", "brand", "neutral"] },
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right", "top-start", "bottom-end"]
    },
    disabled: { control: "boolean" }
  },
  args: {
    message: "Delete this item? This cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
    tone: "danger",
    placement: "top",
    disabled: false
  },
  render: (args) => html`
    <div style="padding: 6rem; display: flex; justify-content: center;">
      <fluid-popconfirm
        message=${args.message}
        confirm-text=${args.confirmText}
        cancel-text=${args.cancelText}
        tone=${args.tone}
        placement=${args.placement}
        ?disabled=${args.disabled}
      >
        <fluid-button slot="trigger" variant="secondary" tone="danger">
          Delete
        </fluid-button>
      </fluid-popconfirm>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Tones: Story = {
  render: () => html`
    <div style="padding: 6rem; display: flex; gap: var(--fluid-space-4); justify-content: center;">
      <fluid-popconfirm tone="danger" message="Delete this file?" confirm-text="Delete">
        <fluid-button slot="trigger" variant="secondary" tone="danger">Danger</fluid-button>
      </fluid-popconfirm>
      <fluid-popconfirm tone="warning" message="Discard unsaved changes?" confirm-text="Discard">
        <fluid-button slot="trigger" variant="secondary" tone="warning">Warning</fluid-button>
      </fluid-popconfirm>
      <fluid-popconfirm tone="brand" message="Publish this draft now?" confirm-text="Publish">
        <fluid-button slot="trigger" variant="secondary">Brand</fluid-button>
      </fluid-popconfirm>
      <fluid-popconfirm tone="neutral" message="Archive this conversation?" confirm-text="Archive">
        <fluid-button slot="trigger" variant="secondary" tone="neutral">Neutral</fluid-button>
      </fluid-popconfirm>
    </div>
  `
};

export const Placements: Story = {
  render: () => html`
    <div style="padding: 8rem; display: flex; gap: var(--fluid-space-4); justify-content: center;">
      <fluid-popconfirm placement="top" message="Confirm on top?">
        <fluid-button slot="trigger" variant="secondary">Top</fluid-button>
      </fluid-popconfirm>
      <fluid-popconfirm placement="bottom" message="Confirm on bottom?">
        <fluid-button slot="trigger" variant="secondary">Bottom</fluid-button>
      </fluid-popconfirm>
      <fluid-popconfirm placement="right" message="Confirm on the right?">
        <fluid-button slot="trigger" variant="secondary">Right</fluid-button>
      </fluid-popconfirm>
    </div>
  `
};

export const CustomLabels: Story = {
  args: {
    message: "Sign out of all devices?",
    confirmText: "Sign out everywhere",
    cancelText: "Stay signed in",
    tone: "warning"
  }
};
