import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidTag } from "./fluid-tag.js";

type Args = Pick<FluidTag, "variant" | "size" | "removable" | "disabled" | "removeLabel"> & {
  text: string;
};

const meta: Meta<Args> = {
  title: "Components/Content/Tag",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["neutral", "info", "success", "warning", "danger"]
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    removable: { control: "boolean" },
    disabled: { control: "boolean" },
    removeLabel: { control: "text" }
  },
  args: {
    variant: "neutral",
    size: "md",
    removable: false,
    disabled: false,
    removeLabel: "Remove",
    text: "Tag"
  },
  render: (args) => html`
    <fluid-tag
      variant=${args.variant}
      size=${args.size}
      remove-label=${args.removeLabel}
      ?removable=${args.removable}
      ?disabled=${args.disabled}
    >
      ${args.text}
    </fluid-tag>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-2);">
      <fluid-tag>Neutral</fluid-tag>
      <fluid-tag variant="info">Info</fluid-tag>
      <fluid-tag variant="success">Success</fluid-tag>
      <fluid-tag variant="warning">Warning</fluid-tag>
      <fluid-tag variant="danger">Danger</fluid-tag>
    </div>
  `
};

export const Removable: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-2); flex-wrap: wrap;">
      <fluid-tag removable>React</fluid-tag>
      <fluid-tag removable variant="info">TypeScript</fluid-tag>
      <fluid-tag removable variant="success">Web Components</fluid-tag>
      <fluid-tag removable variant="warning">CSS-in-JS</fluid-tag>
    </div>
  `
};

export const CustomRemoveLabel: Story = {
  name: "Custom remove label",
  parameters: {
    docs: {
      description: {
        story:
          "The × carries no text, so `remove-label` is the only thing telling a screen reader what activating it does. Worth setting whenever the button does something other than drop the tag — here it leaves a scope rather than removing a filter."
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-2); flex-wrap: wrap;">
      <fluid-tag removable variant="info" remove-label="Back to CURO">
        Domain: PAYTER
      </fluid-tag>
      <fluid-tag removable remove-label="Clear the date range">
        Last 7 days
      </fluid-tag>
    </div>
  `
};
