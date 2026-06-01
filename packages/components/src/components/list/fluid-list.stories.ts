import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidList } from "./fluid-list.js";

type Args = Pick<FluidList, "label" | "bordered" | "divided">;

const meta: Meta<Args> = {
  title: "Components/Content/List",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    label: { control: "text" },
    bordered: { control: "boolean" },
    divided: { control: "boolean" }
  },
  args: { label: "Team members", bordered: true, divided: true },
  render: (args) => html`
    <fluid-list
      style="max-width: 28rem;"
      label=${args.label}
      ?bordered=${args.bordered}
      ?divided=${args.divided}
    >
      <fluid-list-item>
        <span slot="leading">👤</span>
        Ada Lovelace
        <span slot="description">Owner</span>
        <span slot="trailing">Admin</span>
      </fluid-list-item>
      <fluid-list-item>
        <span slot="leading">👤</span>
        Alan Turing
        <span slot="description">Engineer</span>
        <span slot="trailing">Member</span>
      </fluid-list-item>
      <fluid-list-item>
        <span slot="leading">👤</span>
        Grace Hopper
        <span slot="description">Engineer</span>
        <span slot="trailing">Member</span>
      </fluid-list-item>
    </fluid-list>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Plain: Story = {
  args: { bordered: false, divided: false },
  render: (args) => html`
    <fluid-list style="max-width: 28rem;" label=${args.label}>
      <fluid-list-item>One</fluid-list-item>
      <fluid-list-item>Two</fluid-list-item>
      <fluid-list-item>Three</fluid-list-item>
    </fluid-list>
  `
};

export const WithDescriptions: Story = {
  render: () => html`
    <fluid-list style="max-width: 28rem;" label="Settings" bordered divided>
      <fluid-list-item>
        Notifications
        <span slot="description">Email and push alerts</span>
        <span slot="trailing">On</span>
      </fluid-list-item>
      <fluid-list-item>
        Privacy
        <span slot="description">Who can see your profile</span>
        <span slot="trailing">Public</span>
      </fluid-list-item>
    </fluid-list>
  `
};

export const Interactive: Story = {
  render: () => html`
    <fluid-list
      style="max-width: 28rem;"
      label="Choose a workspace"
      bordered
      divided
      @fluid-select=${(e: Event) =>
        console.log("selected", (e.target as HTMLElement).textContent?.trim())}
    >
      <fluid-list-item interactive>
        <span slot="leading">🏢</span>
        Acme Corp
        <span slot="description">12 projects</span>
      </fluid-list-item>
      <fluid-list-item interactive>
        <span slot="leading">🚀</span>
        Side Project
        <span slot="description">3 projects</span>
      </fluid-list-item>
      <fluid-list-item interactive disabled>
        <span slot="leading">🔒</span>
        Archived
        <span slot="description">Read-only</span>
      </fluid-list-item>
    </fluid-list>
  `
};

export const Links: Story = {
  render: () => html`
    <fluid-list style="max-width: 28rem;" label="Documentation" bordered divided>
      <fluid-list-item href="#getting-started">
        Getting started
        <span slot="trailing">→</span>
      </fluid-list-item>
      <fluid-list-item href="#components">
        Components
        <span slot="trailing">→</span>
      </fluid-list-item>
      <fluid-list-item href="#theming" target="_blank">
        Theming
        <span slot="trailing">↗</span>
      </fluid-list-item>
    </fluid-list>
  `
};
