import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidThemeToggle } from "./fluid-theme-toggle.js";

type Args = Pick<FluidThemeToggle, "theme" | "brands">;

const meta: Meta<Args> = {
  title: "Components/Utilities/Theme toggle",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    theme: { control: "inline-radio", options: ["light", "dark"] },
    brands: { control: "object" }
  },
  args: { theme: "light", brands: [] },
  render: (args) => html`
    <fluid-theme-toggle
      theme=${args.theme}
      .brands=${args.brands}
    ></fluid-theme-toggle>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Dark: Story = {
  args: { theme: "dark" }
};

export const WithBrandCycle: Story = {
  args: { brands: ["", "midnight", "corporate"] }
};

export const InAppBar: Story = {
  render: () => html`
    <div
      style="display:flex; align-items:center; justify-content:space-between; gap: var(--fluid-space-3); padding: var(--fluid-space-3); border: 1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md);"
    >
      <strong>My app</strong>
      <fluid-theme-toggle .brands=${["", "midnight", "corporate"]}></fluid-theme-toggle>
    </div>
  `
};
