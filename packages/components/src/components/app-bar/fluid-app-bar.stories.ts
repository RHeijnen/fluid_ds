import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidAppBar } from "./fluid-app-bar.js";

type Args = Pick<
  FluidAppBar,
  "sticky" | "elevated" | "menuButton" | "expanded" | "menuLabel"
>;

const meta: Meta<Args> = {
  title: "Components/Navigation/App bar",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    sticky: { control: "boolean" },
    elevated: { control: "boolean" },
    menuButton: { control: "boolean" },
    expanded: { control: "boolean" },
    menuLabel: { control: "text" }
  },
  args: {
    sticky: false,
    elevated: true,
    menuButton: false,
    expanded: false,
    menuLabel: "Open menu"
  },
  render: (args) => html`
    <fluid-app-bar
      ?sticky=${args.sticky}
      ?elevated=${args.elevated}
      ?menu-button=${args.menuButton}
      ?expanded=${args.expanded}
      menu-label=${args.menuLabel}
    >
      <strong slot="start" style="font-size: var(--fluid-font-size-lg);">Acme</strong>
      <a href="#" style="color: inherit;">Dashboard</a>
      <a href="#" style="color: inherit;">Projects</a>
      <a href="#" style="color: inherit;">Team</a>
      <span slot="end">Sign in</span>
    </fluid-app-bar>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithMenuButton: Story = {
  args: { menuButton: true }
};

export const Plain: Story = {
  render: () => html`
    <fluid-app-bar>
      <strong slot="start" style="font-size: var(--fluid-font-size-lg);">Acme</strong>
      <a href="#" style="color: inherit;">Home</a>
      <a href="#" style="color: inherit;">Docs</a>
      <span slot="end">Sign in</span>
    </fluid-app-bar>
  `
};

export const Elevated: Story = {
  render: () => html`
    <fluid-app-bar elevated>
      <strong slot="start" style="font-size: var(--fluid-font-size-lg);">Acme</strong>
      <a href="#" style="color: inherit;">Home</a>
      <a href="#" style="color: inherit;">Docs</a>
      <span slot="end">Sign in</span>
    </fluid-app-bar>
  `
};

export const StartAndEndOnly: Story = {
  render: () => html`
    <fluid-app-bar elevated menu-button>
      <strong slot="start" style="font-size: var(--fluid-font-size-lg);">Acme</strong>
      <span slot="end">Profile</span>
    </fluid-app-bar>
  `
};
