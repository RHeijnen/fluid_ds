import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidAnchorNav, FluidAnchorNavItem } from "./fluid-anchor-nav.js";

type Args = Pick<FluidAnchorNav, "navLabel" | "headingSelector" | "topOffset"> & {
  items: FluidAnchorNavItem[];
};

const sampleItems: FluidAnchorNavItem[] = [
  { id: "intro", label: "Introduction", level: 2 },
  { id: "install", label: "Installation", level: 2 },
  { id: "config", label: "Configuration", level: 3 },
  { id: "plugins", label: "Plugins", level: 3 },
  { id: "usage", label: "Usage", level: 2 },
  { id: "api", label: "API reference", level: 2 },
];

const meta: Meta<Args> = {
  title: "Components/Navigation/Anchor nav",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    navLabel: { control: "text" },
    headingSelector: { control: "text" },
    topOffset: { control: "number" },
    items: { control: "object" },
  },
  args: {
    navLabel: "On this page",
    headingSelector: "h2,h3",
    topOffset: 0,
    items: sampleItems,
  },
  render: (args) => html`
    <fluid-anchor-nav
      nav-label=${args.navLabel}
      .items=${args.items}
      offset-top=${args.topOffset}
    ></fluid-anchor-nav>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const NestedLevels: Story = {
  render: () =>
    html`<fluid-anchor-nav .items=${sampleItems}></fluid-anchor-nav>`,
};

/**
 * With a sample of scrollable sections wired up, the link for the section in
 * view is marked `aria-current="true"` and styled active.
 */
export const ScrollSpy: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-8); align-items: flex-start;">
      <fluid-anchor-nav
        style="position: sticky; top: var(--fluid-space-4); flex: 0 0 12rem;"
        scope="#story-scope"
      ></fluid-anchor-nav>
      <div
        id="story-scope"
        style="flex: 1; max-height: 16rem; overflow:auto; padding: var(--fluid-space-2);"
      >
        <h2 id="s-overview">Overview</h2>
        <p style="min-height: 8rem;">Scroll this column to watch the active link update.</p>
        <h2 id="s-details">Details</h2>
        <p style="min-height: 8rem;">More content for the second section.</p>
        <h2 id="s-summary">Summary</h2>
        <p style="min-height: 8rem;">Final section wrapping things up.</p>
      </div>
    </div>
  `,
};
