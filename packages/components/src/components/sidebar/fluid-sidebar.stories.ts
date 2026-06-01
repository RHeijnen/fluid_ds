import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidSidebar } from "./fluid-sidebar.js";

type Args = Pick<FluidSidebar, "open" | "collapsible" | "overlay" | "width" | "mini">;

const navStyle =
  "display:flex; flex-direction:column; gap: var(--fluid-space-1); list-style:none; margin:0; padding:0;";
const linkStyle =
  "display:block; padding: var(--fluid-space-2) var(--fluid-space-3); border-radius: var(--fluid-radius-sm); color: inherit; text-decoration:none;";

const navContent = html`
  <nav aria-label="Primary" style=${navStyle}>
    <a href="#" style=${linkStyle} aria-current="page">Dashboard</a>
    <a href="#" style=${linkStyle}>Projects</a>
    <a href="#" style=${linkStyle}>Team</a>
    <a href="#" style=${linkStyle}>Reports</a>
    <a href="#" style=${linkStyle}>Settings</a>
  </nav>
`;

const meta: Meta<Args> = {
  title: "Components/Navigation/Sidebar",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    open: { control: "boolean" },
    collapsible: { control: "boolean" },
    overlay: { control: "boolean" },
    width: { control: "text" },
    mini: { control: "text" }
  },
  args: { open: true, collapsible: false, overlay: false },
  render: (args) => html`
    <div style="block-size: 360px; display:flex; border:1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md); overflow:hidden;">
      <fluid-sidebar
        aria-label="Primary navigation"
        ?open=${args.open}
        ?collapsible=${args.collapsible}
        ?overlay=${args.overlay}
        width=${args.width ?? ""}
        mini=${args.mini ?? ""}
      >
        <strong slot="header">Fluid</strong>
        ${navContent}
        <small slot="footer">v1.0.0</small>
      </fluid-sidebar>
      <div style="flex:1; padding: var(--fluid-space-5);">Page content</div>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Collapsible: Story = {
  render: () => html`
    <div style="block-size: 360px; display:flex; gap: var(--fluid-space-4); align-items:flex-start;">
      <fluid-sidebar id="sb-collapsible" collapsible aria-label="Primary navigation">
        <strong slot="header">Fluid</strong>
        ${navContent}
      </fluid-sidebar>
      <button
        type="button"
        @click=${() =>
          (document.getElementById("sb-collapsible") as FluidSidebar)?.toggle()}
      >
        Toggle rail
      </button>
    </div>
  `
};

export const Mini: Story = {
  args: { open: false, collapsible: true, mini: "5rem" }
};

export const Overlay: Story = {
  render: () => html`
    <div style="position:relative; block-size: 360px; border:1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md); overflow:hidden;">
      <div style="padding: var(--fluid-space-5);">
        <button
          type="button"
          @click=${() =>
            (document.getElementById("sb-overlay") as FluidSidebar)?.show()}
        >
          Open navigation
        </button>
      </div>
      <fluid-sidebar id="sb-overlay" overlay aria-label="Primary navigation" style="position:absolute;">
        <strong slot="header">Fluid</strong>
        ${navContent}
        <small slot="footer">v1.0.0</small>
      </fluid-sidebar>
    </div>
  `
};
