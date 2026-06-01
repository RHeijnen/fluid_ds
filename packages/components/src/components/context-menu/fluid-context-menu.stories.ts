import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

function logSelect(e: Event) {
  console.log("fluid-select", (e as CustomEvent<{ value: string }>).detail.value);
}

const targetStyle =
  "display:grid;place-items:center;width:18rem;height:9rem;border:1px dashed var(--fluid-border-default,#e4e4e7);border-radius:var(--fluid-radius-md,8px);color:var(--fluid-text-secondary,#3f3f46);user-select:none;cursor:context-menu;font-family:var(--fluid-font-family-sans,system-ui)";

const meta: Meta = {
  title: "Components/Navigation/Context menu",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`
    <fluid-context-menu
      aria-label="Item actions"
      .items=${[
        { label: "Cut", value: "cut" },
        { label: "Copy", value: "copy" },
        { label: "Paste", value: "paste", disabled: true },
        { label: "", value: "", divider: true },
        { label: "Delete", value: "delete" }
      ]}
      @fluid-select=${logSelect}
    >
      <div slot="trigger" tabindex="0" style=${targetStyle}>
        Right-click here (or Shift+F10)
      </div>
    </fluid-context-menu>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const FromItemsArray: Story = {
  render: () => html`
    <fluid-context-menu
      aria-label="File actions"
      .items=${[
        { label: "New file", value: "new" },
        { label: "Rename", value: "rename" },
        { label: "Duplicate", value: "duplicate" },
        { label: "", value: "", divider: true },
        { label: "Move to trash", value: "trash" }
      ]}
      @fluid-select=${logSelect}
    >
      <div slot="trigger" tabindex="0" style=${targetStyle}>document.txt</div>
    </fluid-context-menu>
  `
};

export const WithDisabledEntry: Story = {
  render: () => html`
    <fluid-context-menu
      aria-label="Edit actions"
      .items=${[
        { label: "Undo", value: "undo" },
        { label: "Redo", value: "redo", disabled: true },
        { label: "Cut", value: "cut" },
        { label: "Paste", value: "paste", disabled: true }
      ]}
      @fluid-select=${logSelect}
    >
      <div slot="trigger" tabindex="0" style=${targetStyle}>Editor canvas</div>
    </fluid-context-menu>
  `
};

export const CustomMenuSlot: Story = {
  render: () => html`
    <fluid-context-menu aria-label="Account" @fluid-select=${logSelect}>
      <div slot="trigger" tabindex="0" style=${targetStyle}>Avatar</div>
      <fluid-menu slot="menu" aria-label="Account">
        <fluid-menu-label>Account</fluid-menu-label>
        <fluid-menu-item value="profile">Profile</fluid-menu-item>
        <fluid-menu-item value="settings">Settings</fluid-menu-item>
        <fluid-menu-label>Session</fluid-menu-label>
        <fluid-menu-item value="logout">Sign out</fluid-menu-item>
      </fluid-menu>
    </fluid-context-menu>
  `
};

export const Disabled: Story = {
  render: () => html`
    <fluid-context-menu
      disabled
      aria-label="Disabled"
      .items=${[{ label: "Copy", value: "copy" }]}
    >
      <div slot="trigger" tabindex="0" style=${targetStyle}>
        Right-click falls through (disabled)
      </div>
    </fluid-context-menu>
  `
};
