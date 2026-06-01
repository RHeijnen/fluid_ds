import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Content/Kbd",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`<fluid-kbd>Ctrl</fluid-kbd>`
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Shortcut: Story = {
  render: () => html`
    <span style="display:inline-flex; align-items:center; gap:0.3rem;">
      <fluid-kbd>Ctrl</fluid-kbd> + <fluid-kbd>K</fluid-kbd>
    </span>
  `
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; align-items:center; gap:0.75rem;">
      <fluid-kbd size="sm">Esc</fluid-kbd>
      <fluid-kbd size="md">Enter</fluid-kbd>
      <fluid-kbd size="lg">Space</fluid-kbd>
    </div>
  `
};
