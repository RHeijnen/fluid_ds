import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";

const meta: Meta = {
  title: "Components/Drawer",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const showDrawer = (e: Event, placement: string) => {
  (e.target as HTMLElement)
    .closest("[data-story]")
    ?.querySelector<HTMLElement & { show: () => void }>(`fluid-drawer[placement="${placement}"]`)
    ?.show();
};

export const AllPlacements: Story = {
  render: () => html`
    <div data-story>
      <div style="display:flex; gap: var(--fluid-space-2); flex-wrap: wrap;">
        ${(["start", "end", "top", "bottom"] as const).map(
          (p) => html`
            <fluid-button @click=${(e: Event) => showDrawer(e, p)}>
              Open ${p}
            </fluid-button>
          `
        )}
      </div>
      ${(["start", "end", "top", "bottom"] as const).map(
        (p) => html`
          <fluid-drawer placement=${p}>
            <span slot="label">${p} drawer</span>
            <p>Slides in from the ${p}. Click the backdrop or press Esc to close.</p>
          </fluid-drawer>
        `
      )}
    </div>
  `
};
