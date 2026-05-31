import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Observers/Resize observer",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <fluid-resize-observer
      @fluid-resize=${(e: CustomEvent) => {
        const entry = e.detail.entries[0] as ResizeObserverEntry;
        const out = (e.currentTarget as HTMLElement).nextElementSibling;
        const { width, height } = entry.contentRect;
        if (out) out.textContent = `width: ${Math.round(width)}px · height: ${Math.round(height)}px`;
      }}
    >
      <div
        style="resize: both; overflow: auto; padding: var(--fluid-space-3); border: 1px dashed var(--fluid-border-default); width: 12rem; height: 4rem;"
      >
        Drag the bottom-right corner to resize.
      </div>
    </fluid-resize-observer>
    <p style="font-family: monospace;">No size reported yet.</p>
  `
};
