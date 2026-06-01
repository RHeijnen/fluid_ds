import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../badge/define.js";
import type { FluidAvatar } from "./fluid-avatar.js";

type Args = Pick<FluidAvatar, "size" | "shape" | "image" | "initials" | "label">;

const meta: Meta<Args> = {
  title: "Components/Content/Avatar",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg", "xl"] },
    shape: { control: "inline-radio", options: ["circle", "rounded", "square"] }
  },
  args: {
    size: "md",
    shape: "circle",
    image: "",
    initials: "",
    label: "Ada Lovelace"
  },
  render: (args) => html`
    <fluid-avatar
      size=${args.size}
      shape=${args.shape}
      image=${args.image}
      initials=${args.initials}
      label=${args.label}
    ></fluid-avatar>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Initials: Story = {};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; align-items:flex-end; gap: var(--fluid-space-3);">
      ${(["xs", "sm", "md", "lg", "xl"] as const).map(
        (s) => html`<fluid-avatar size=${s} label="Ada Lovelace"></fluid-avatar>`
      )}
    </div>
  `
};

export const Shapes: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3);">
      <fluid-avatar shape="circle" label="Ada Lovelace"></fluid-avatar>
      <fluid-avatar shape="rounded" label="Ada Lovelace"></fluid-avatar>
      <fluid-avatar shape="square" label="Ada Lovelace"></fluid-avatar>
    </div>
  `
};

export const WithBadge: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3);">
      <fluid-avatar label="Ada Lovelace">
        <fluid-badge slot="badge" dot variant="success"></fluid-badge>
      </fluid-avatar>
      <fluid-avatar label="Grace Hopper">
        <fluid-badge slot="badge" variant="danger" size="sm">3</fluid-badge>
      </fluid-avatar>
    </div>
  `
};
