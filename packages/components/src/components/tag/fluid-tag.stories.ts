import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidTag } from "./fluid-tag.js";

type Args = Pick<FluidTag, "variant" | "size" | "removable" | "disabled"> & { text: string };

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
    disabled: { control: "boolean" }
  },
  args: { variant: "neutral", size: "md", removable: false, disabled: false, text: "Tag" },
  render: (args) => html`
    <fluid-tag
      variant=${args.variant}
      size=${args.size}
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
