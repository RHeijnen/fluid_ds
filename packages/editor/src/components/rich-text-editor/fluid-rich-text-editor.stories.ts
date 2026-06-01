import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Editor/Rich text editor",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" }
  },
  render: ({ label, placeholder }) => html`
    <fluid-rich-text-editor
      style="max-width: 36rem;"
      label=${label ?? "Rich text editor"}
      placeholder=${placeholder ?? ""}
    ></fluid-rich-text-editor>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: { label: "Rich text editor", placeholder: "" }
};

export const WithPlaceholder: Story = {
  args: { label: "Compose a note", placeholder: "Start typing your note..." }
};

export const WithInitialContent: Story = {
  render: () => {
    const el = document.createElement("fluid-rich-text-editor");
    el.style.maxWidth = "36rem";
    el.label = "Article body";
    el.value =
      "<p><strong>Fluid</strong> ships an accessible editor.</p><ul><li>Toggle <em>formatting</em></li><li>Make lists</li></ul>";
    return el;
  }
};

export const Themed: Story = {
  render: () => html`
    <fluid-rich-text-editor
      style="
        max-width: 36rem;
        --fluid-editor-toolbar-bg: #1e1b4b;
        --fluid-editor-focus: #a5b4fc;
        --fluid-editor-radius: 1rem;
      "
      label="Themed editor"
      placeholder="Custom toolbar background and radius..."
    ></fluid-rich-text-editor>
  `
};
