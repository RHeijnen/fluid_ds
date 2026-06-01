import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Utilities/Mutation observer",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <fluid-mutation-observer
      child-list
      subtree
      @fluid-mutation=${(e: CustomEvent) => {
        const out = (e.currentTarget as HTMLElement).nextElementSibling;
        if (out) out.textContent = `${e.detail.records.length} mutation(s) at ${new Date().toLocaleTimeString()}`;
      }}
    >
      <div id="watched" style="padding: var(--fluid-space-3); border: 1px dashed var(--fluid-border-default);">
        <button
          type="button"
          @click=${(e: Event) => {
            const list = (e.target as HTMLElement).parentElement!.querySelector("ul")!;
            const li = document.createElement("li");
            li.textContent = `item ${list.children.length + 1}`;
            list.appendChild(li);
          }}
        >
          Add item
        </button>
        <ul></ul>
      </div>
    </fluid-mutation-observer>
    <p>No mutations yet.</p>
  `
};
