import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import type { FluidBanner } from "./fluid-banner.js";

type Args = Pick<FluidBanner, "variant" | "dismissible" | "label"> & {
  text: string;
};

const meta: Meta<Args> = {
  title: "Components/Feedback/Banner",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["info", "success", "warning", "danger", "neutral"]
    },
    dismissible: { control: "boolean" },
    label: { control: "text" }
  },
  args: {
    variant: "info",
    dismissible: false,
    label: "",
    text: "We are performing scheduled maintenance this weekend."
  },
  render: (args) => html`
    <fluid-banner
      variant=${args.variant}
      ?dismissible=${args.dismissible}
      label=${args.label}
    >
      ${args.text}
    </fluid-banner>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex; flex-direction: column; gap: var(--fluid-space-2);">
      <fluid-banner variant="neutral">Neutral announcement bar.</fluid-banner>
      <fluid-banner variant="info">Informational notice for everyone.</fluid-banner>
      <fluid-banner variant="success">Your changes were published.</fluid-banner>
      <fluid-banner variant="warning">Your trial ends in three days.</fluid-banner>
      <fluid-banner variant="danger">A service outage is affecting logins.</fluid-banner>
    </div>
  `
};

export const Dismissible: Story = {
  args: { dismissible: true, variant: "warning" }
};

export const WithActions: Story = {
  render: () => html`
    <fluid-banner variant="info" dismissible>
      We use cookies to improve your experience.
      <fluid-button slot="actions" variant="ghost" size="sm">Settings</fluid-button>
      <fluid-button slot="actions" variant="primary" size="sm">Accept</fluid-button>
    </fluid-banner>
  `
};

export const CustomLabel: Story = {
  args: {
    variant: "danger",
    label: "Outage notice",
    text: "Payments are temporarily unavailable while we investigate."
  }
};
