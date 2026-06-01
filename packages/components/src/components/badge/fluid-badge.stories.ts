import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidBadge } from "./fluid-badge.js";

type Args = Pick<FluidBadge, "variant" | "size" | "dot"> & { content: string };

const meta: Meta<Args> = {
  title: "Components/Content/Badge",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["neutral", "info", "success", "warning", "danger"]
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    dot: { control: "boolean" },
    content: { control: "text" }
  },
  args: {
    variant: "neutral",
    size: "md",
    dot: false,
    content: "New"
  },
  render: (args) => html`
    <fluid-badge variant=${args.variant} size=${args.size} ?dot=${args.dot}>
      ${args.content}
    </fluid-badge>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-2); align-items:center;">
      <fluid-badge>Neutral</fluid-badge>
      <fluid-badge variant="info">Info</fluid-badge>
      <fluid-badge variant="success">Success</fluid-badge>
      <fluid-badge variant="warning">Warning</fluid-badge>
      <fluid-badge variant="danger">Danger</fluid-badge>
    </div>
  `
};

export const Dots: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center;">
      <fluid-badge dot></fluid-badge>
      <fluid-badge dot variant="info"></fluid-badge>
      <fluid-badge dot variant="success"></fluid-badge>
      <fluid-badge dot variant="warning"></fluid-badge>
      <fluid-badge dot variant="danger"></fluid-badge>
    </div>
  `
};
