import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/icons/register-defaults";
import { listIcons } from "@fluid-ds/icons";
import "./define.js";
import type { FluidIcon } from "./fluid-icon.js";

type Args = Pick<FluidIcon, "name" | "label">;

const meta: Meta<Args> = {
  title: "Components/Content/Icon",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    name: { control: "select", options: listIcons() },
    label: { control: "text" }
  },
  args: {
    name: "check"
  },
  render: (args) => html`
    <fluid-icon name=${args.name ?? ""} label=${args.label ?? ""}></fluid-icon>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; gap:var(--fluid-space-3); align-items:center;">
      <fluid-icon name="check" style="font-size: 12px"></fluid-icon>
      <fluid-icon name="check" style="font-size: 16px"></fluid-icon>
      <fluid-icon name="check" style="font-size: 24px"></fluid-icon>
      <fluid-icon name="check" style="font-size: 32px"></fluid-icon>
      <fluid-icon name="check" style="font-size: 48px"></fluid-icon>
    </div>
  `
};

export const Colors: Story = {
  render: () => html`
    <div style="display:flex; gap:var(--fluid-space-3); font-size: 24px;">
      <fluid-icon name="info" style="color: var(--fluid-accent-base)"></fluid-icon>
      <fluid-icon name="alert-triangle" style="color: #d97706"></fluid-icon>
      <fluid-icon name="close" style="color: #dc2626"></fluid-icon>
      <fluid-icon name="check" style="color: #16a34a"></fluid-icon>
    </div>
  `
};

export const Gallery: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--fluid-space-4); font-size: 24px;"
    >
      ${listIcons().map(
        (name) => html`
          <div
            style="display:flex; flex-direction:column; align-items:center; gap: var(--fluid-space-2); padding: var(--fluid-space-3); border: 1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md); font-size: 32px;"
          >
            <fluid-icon name=${name}></fluid-icon>
            <code style="font-size: 11px; color: var(--fluid-text-secondary);">${name}</code>
          </div>
        `
      )}
    </div>
  `
};
