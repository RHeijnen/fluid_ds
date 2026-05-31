import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Popup",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <div style="padding: 4rem;">
      <fluid-popup open placement="bottom-start" distance="8">
        <button slot="anchor" type="button">Anchor</button>
        <div
          style="
            padding: var(--fluid-space-3) var(--fluid-space-4);
            background: var(--fluid-color-neutral-900);
            color: white;
            border-radius: var(--fluid-radius-md);
            font-size: 0.875rem;
          "
        >
          Positioned popup
        </div>
      </fluid-popup>
    </div>
  `
};
