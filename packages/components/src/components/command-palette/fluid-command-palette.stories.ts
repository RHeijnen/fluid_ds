import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import type { FluidCommandPalette, FluidCommandItem } from "./fluid-command-palette.js";

type Args = Pick<FluidCommandPalette, "open" | "placeholder"> & {
  items: FluidCommandItem[];
};

const sampleItems: FluidCommandItem[] = [
  { id: "new-file", label: "New File", hint: "⌘N", group: "File" },
  { id: "open-file", label: "Open File…", hint: "⌘O", group: "File" },
  { id: "save", label: "Save", hint: "⌘S", group: "File" },
  { id: "copy", label: "Copy", hint: "⌘C", group: "Edit" },
  { id: "paste", label: "Paste", hint: "⌘V", group: "Edit" },
  { id: "find", label: "Find in File", hint: "⌘F", group: "Edit" },
  { id: "toggle-theme", label: "Toggle Dark Theme", group: "View" },
  { id: "zen", label: "Toggle Zen Mode", group: "View" }
];

const flatItems: FluidCommandItem[] = [
  { id: "dashboard", label: "Go to Dashboard" },
  { id: "settings", label: "Open Settings" },
  { id: "profile", label: "View Profile" },
  { id: "logout", label: "Log out" }
];

const meta: Meta<Args> = {
  title: "Components/Navigation/Command palette",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    open: { control: "boolean" },
    placeholder: { control: "text" },
    items: { control: "object" }
  },
  args: {
    open: true,
    placeholder: "Type a command or search…",
    items: sampleItems
  },
  render: (args) => html`
    <fluid-command-palette
      ?open=${args.open}
      placeholder=${args.placeholder}
      .items=${args.items}
      @fluid-select=${(e: CustomEvent) => console.log("fluid-select", e.detail)}
    ></fluid-command-palette>
  `
};

export default meta;
type Story = StoryObj<Args>;

/** Open by default so the controls panel drives a visible palette. */
export const Default: Story = {};

/** Grouped results: items with a `group` are bucketed under uppercase headings. */
export const Grouped: Story = {
  args: { items: sampleItems }
};

/** A flat list with no groups and no trailing hints. */
export const Flat: Story = {
  args: { items: flatItems }
};

/** Pre-filtered to show the active highlight and the substring match. */
export const Filtered: Story = {
  render: (args) => {
    const el = document.createElement("fluid-command-palette") as FluidCommandPalette;
    el.items = args.items;
    el.open = true;
    // Seed the query after upgrade so the input + filter reflect it.
    queueMicrotask(() => {
      const input = el.shadowRoot?.querySelector<HTMLInputElement>("input");
      if (input) {
        input.value = "to";
        input.dispatchEvent(new Event("input"));
      }
    });
    return el;
  },
  args: { items: sampleItems }
};

/** The empty state, shown when the query matches no item. */
export const NoResults: Story = {
  render: (args) => {
    const el = document.createElement("fluid-command-palette") as FluidCommandPalette;
    el.items = args.items;
    el.open = true;
    queueMicrotask(() => {
      const input = el.shadowRoot?.querySelector<HTMLInputElement>("input");
      if (input) {
        input.value = "zzzz";
        input.dispatchEvent(new Event("input"));
      }
    });
    return el;
  },
  args: { items: sampleItems }
};

/** A real trigger button that opens the palette, the typical usage. */
export const WithTrigger: Story = {
  render: (args) => html`
    <fluid-button
      @click=${(e: Event) => {
        const palette = (e.currentTarget as HTMLElement)
          .nextElementSibling as FluidCommandPalette;
        palette.show();
      }}
      >Open command palette (⌘K)</fluid-button
    >
    <fluid-command-palette
      placeholder=${args.placeholder}
      .items=${args.items}
      @fluid-select=${(e: CustomEvent) => console.log("fluid-select", e.detail)}
    ></fluid-command-palette>
  `,
  args: { open: false, items: sampleItems }
};
