import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../icon/define.js";

const meta: Meta = {
  title: "Components/Navigation/Menu",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`
    <fluid-menu aria-label="Actions" @fluid-select=${logSelect}>
      <fluid-menu-item value="new">New file</fluid-menu-item>
      <fluid-menu-item value="open">Open…</fluid-menu-item>
      <fluid-menu-item value="save">Save</fluid-menu-item>
      <fluid-menu-item value="delete" disabled>Delete</fluid-menu-item>
    </fluid-menu>
  `
};

export default meta;
type Story = StoryObj;

function logSelect(e: Event) {
  console.log("fluid-select", (e as CustomEvent<{ value: string }>).detail.value);
}

export const Default: Story = {};

export const WithIcons: Story = {
  render: () => html`
    <fluid-menu aria-label="Edit actions" @fluid-select=${logSelect}>
      <fluid-menu-item value="cut">
        <fluid-icon slot="icon" name="scissors"></fluid-icon>
        Cut
      </fluid-menu-item>
      <fluid-menu-item value="copy">
        <fluid-icon slot="icon" name="copy"></fluid-icon>
        Copy
      </fluid-menu-item>
      <fluid-menu-item value="paste">
        <fluid-icon slot="icon" name="clipboard"></fluid-icon>
        Paste
      </fluid-menu-item>
    </fluid-menu>
  `
};

export const WithLabels: Story = {
  render: () => html`
    <fluid-menu aria-label="Account menu" @fluid-select=${logSelect}>
      <fluid-menu-label>Account</fluid-menu-label>
      <fluid-menu-item value="profile">
        <fluid-icon slot="icon" name="user"></fluid-icon>
        Profile
      </fluid-menu-item>
      <fluid-menu-item value="billing">
        <fluid-icon slot="icon" name="credit-card"></fluid-icon>
        Billing
      </fluid-menu-item>
      <fluid-menu-label>Session</fluid-menu-label>
      <fluid-menu-item value="logout">
        <fluid-icon slot="icon" name="log-out"></fluid-icon>
        Sign out
      </fluid-menu-item>
    </fluid-menu>
  `
};

export const Disabled: Story = {
  render: () => html`
    <fluid-menu aria-label="With disabled items" @fluid-select=${logSelect}>
      <fluid-menu-item value="undo">Undo</fluid-menu-item>
      <fluid-menu-item value="redo" disabled>Redo</fluid-menu-item>
      <fluid-menu-item value="cut">Cut</fluid-menu-item>
      <fluid-menu-item value="paste" disabled>Paste</fluid-menu-item>
    </fluid-menu>
  `
};
