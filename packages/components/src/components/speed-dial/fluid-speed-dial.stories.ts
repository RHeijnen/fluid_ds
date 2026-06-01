import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import type { FluidSpeedDial } from "./fluid-speed-dial.js";

type Args = Pick<FluidSpeedDial, "open" | "placement" | "label">;

const actions = html`
  <fluid-button variant="ghost" aria-label="Share">Share</fluid-button>
  <fluid-button variant="ghost" aria-label="Edit">Edit</fluid-button>
  <fluid-button variant="ghost" aria-label="Delete">Delete</fluid-button>
`;

const meta: Meta<Args> = {
  title: "Components/Navigation/Speed dial",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    open: { control: "boolean" },
    placement: { control: "inline-radio", options: ["up", "down", "left", "right"] },
    label: { control: "text" }
  },
  args: {
    open: false,
    placement: "up",
    label: "Quick actions"
  },
  render: (args) => html`
    <div style="display:flex; justify-content:center; padding: 8rem 4rem;">
      <fluid-speed-dial ?open=${args.open} placement=${args.placement} label=${args.label}>
        ${actions}
      </fluid-speed-dial>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Open: Story = {
  args: { open: true }
};

export const PlacementUp: Story = {
  args: { open: true, placement: "up", label: "Fan up" }
};

export const PlacementDown: Story = {
  args: { open: true, placement: "down", label: "Fan down" }
};

export const PlacementLeft: Story = {
  args: { open: true, placement: "left", label: "Fan left" }
};

export const PlacementRight: Story = {
  args: { open: true, placement: "right", label: "Fan right" }
};

export const WithDisabledAction: Story = {
  render: () => html`
    <div style="display:flex; justify-content:center; padding: 8rem 4rem;">
      <fluid-speed-dial open placement="up" label="Quick actions">
        <fluid-button variant="ghost" aria-label="Share">Share</fluid-button>
        <fluid-button variant="ghost" aria-label="Edit" disabled>Edit</fluid-button>
        <fluid-button variant="ghost" aria-label="Delete">Delete</fluid-button>
      </fluid-speed-dial>
    </div>
  `
};

export const CustomTriggerIcon: Story = {
  render: () => html`
    <div style="display:flex; justify-content:center; padding: 8rem 4rem;">
      <fluid-speed-dial placement="up" label="Create">
        <span slot="trigger-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
        <fluid-button variant="ghost" aria-label="New document">Doc</fluid-button>
        <fluid-button variant="ghost" aria-label="New folder">Folder</fluid-button>
      </fluid-speed-dial>
    </div>
  `
};
