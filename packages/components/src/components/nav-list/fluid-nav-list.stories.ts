import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../icon/define.js";
import "../badge/define.js";
import type { FluidNavList } from "./fluid-nav-list.js";

type Args = Pick<FluidNavList, "label">;

const meta: Meta<Args> = {
  title: "Components/Navigation/Nav list",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    label: { control: "text" }
  },
  args: { label: "Main" },
  render: (args) => html`
    <div style="max-width: 16rem;">
      <fluid-nav-list label=${args.label}>
        <fluid-nav-item href="#dashboard" current>Dashboard</fluid-nav-item>
        <fluid-nav-item href="#projects">Projects</fluid-nav-item>
        <fluid-nav-item href="#team">Team</fluid-nav-item>
        <fluid-nav-item href="#settings">Settings</fluid-nav-item>
      </fluid-nav-list>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithIcons: Story = {
  render: () => html`
    <div style="max-width: 16rem;">
      <fluid-nav-list label="Workspace">
        <fluid-nav-item href="#home" current>
          <fluid-icon slot="icon" name="house"></fluid-icon>
          Home
        </fluid-nav-item>
        <fluid-nav-item href="#search">
          <fluid-icon slot="icon" name="search"></fluid-icon>
          Search
        </fluid-nav-item>
        <fluid-nav-item href="#settings">
          <fluid-icon slot="icon" name="settings"></fluid-icon>
          Settings
        </fluid-nav-item>
      </fluid-nav-list>
    </div>
  `
};

export const WithBadges: Story = {
  render: () => html`
    <div style="max-width: 16rem;">
      <fluid-nav-list label="Inbox">
        <fluid-nav-item href="#all" current>
          All
          <fluid-badge slot="badge">128</fluid-badge>
        </fluid-nav-item>
        <fluid-nav-item href="#unread">
          Unread
          <fluid-badge slot="badge" variant="info">12</fluid-badge>
        </fluid-nav-item>
        <fluid-nav-item href="#flagged">Flagged</fluid-nav-item>
      </fluid-nav-list>
    </div>
  `
};

export const IconsAndBadges: Story = {
  render: () => html`
    <div style="max-width: 16rem;">
      <fluid-nav-list label="Mail">
        <fluid-nav-item href="#inbox" current>
          <fluid-icon slot="icon" name="inbox"></fluid-icon>
          Inbox
          <fluid-badge slot="badge" variant="info">9</fluid-badge>
        </fluid-nav-item>
        <fluid-nav-item href="#sent">
          <fluid-icon slot="icon" name="send"></fluid-icon>
          Sent
        </fluid-nav-item>
        <fluid-nav-item href="#trash">
          <fluid-icon slot="icon" name="trash"></fluid-icon>
          Trash
        </fluid-nav-item>
      </fluid-nav-list>
    </div>
  `
};
