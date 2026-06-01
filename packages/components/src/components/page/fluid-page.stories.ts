import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Layout/Page",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const region = (label: string, bg: string) => html`
  <div
    style="padding: var(--fluid-space-3); background: ${bg}; border: 1px dashed var(--fluid-border-default);"
  >
    ${label}
  </div>
`;

export const Default: Story = {
  render: () => html`
    <fluid-page style="min-height: 24rem; border: 1px solid var(--fluid-border-default);">
      <div slot="header">${region("Header", "var(--fluid-surface-subtle)")}</div>
      <div slot="navigation">${region("Navigation", "var(--fluid-surface-muted)")}</div>
      ${region("Main content", "var(--fluid-surface-base)")}
      <div slot="aside">${region("Aside", "var(--fluid-surface-muted)")}</div>
      <div slot="footer">${region("Footer", "var(--fluid-surface-subtle)")}</div>
    </fluid-page>
  `
};

export const HeaderAndMainOnly: Story = {
  render: () => html`
    <fluid-page style="min-height: 18rem; border: 1px solid var(--fluid-border-default);">
      <div slot="header">${region("Header", "var(--fluid-surface-subtle)")}</div>
      ${region("Just main content", "var(--fluid-surface-base)")}
    </fluid-page>
  `
};

export const WithBanner: Story = {
  render: () => html`
    <fluid-page style="min-height: 22rem; border: 1px solid var(--fluid-border-default);">
      <div slot="banner">${region("Banner, system status", "var(--fluid-color-warning-soft)")}</div>
      <div slot="header">${region("Header", "var(--fluid-surface-subtle)")}</div>
      ${region("Main", "var(--fluid-surface-base)")}
    </fluid-page>
  `
};
