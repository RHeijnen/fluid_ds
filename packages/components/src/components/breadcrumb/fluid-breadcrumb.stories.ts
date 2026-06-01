import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../icon/define.js";

const meta: Meta = {
  title: "Components/Navigation/Breadcrumb",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <fluid-breadcrumb>
      <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
      <fluid-breadcrumb-item href="/components">Components</fluid-breadcrumb-item>
      <fluid-breadcrumb-item href="/components/button">Button</fluid-breadcrumb-item>
      <fluid-breadcrumb-item>API</fluid-breadcrumb-item>
    </fluid-breadcrumb>
  `
};

export const CustomSeparator: Story = {
  render: () => html`
    <fluid-breadcrumb>
      <fluid-breadcrumb-item href="/">
        Home
        <span slot="separator">›</span>
      </fluid-breadcrumb-item>
      <fluid-breadcrumb-item href="/docs">
        Docs
        <span slot="separator">›</span>
      </fluid-breadcrumb-item>
      <fluid-breadcrumb-item>Getting started</fluid-breadcrumb-item>
    </fluid-breadcrumb>
  `
};

export const WithIcons: Story = {
  render: () => html`
    <fluid-breadcrumb>
      <fluid-breadcrumb-item href="/">
        <fluid-icon slot="prefix" name="chevron-right"></fluid-icon>
        Home
      </fluid-breadcrumb-item>
      <fluid-breadcrumb-item href="/projects">Projects</fluid-breadcrumb-item>
      <fluid-breadcrumb-item>Fluid</fluid-breadcrumb-item>
    </fluid-breadcrumb>
  `
};
