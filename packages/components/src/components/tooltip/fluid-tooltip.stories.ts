import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import type { FluidTooltip } from "./fluid-tooltip.js";

type Args = Pick<FluidTooltip, "content" | "placement" | "open" | "disabled">;

const meta: Meta<Args> = {
  title: "Components/Feedback/Tooltip",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    content: { control: "text" },
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right", "top-start", "top-end", "bottom-start", "bottom-end"]
    },
    open: { control: "boolean" },
    disabled: { control: "boolean" }
  },
  args: {
    content: "Helpful hint",
    placement: "top",
    open: false,
    disabled: false
  },
  render: (args) => html`
    <div style="display:flex; justify-content:center; padding: 4rem;">
      <fluid-tooltip
        content=${args.content}
        placement=${args.placement}
        ?open=${args.open}
        ?disabled=${args.disabled}
      >
        <fluid-button>Hover me</fluid-button>
      </fluid-tooltip>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Placements: Story = {
  render: () => html`
    <div
      style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--fluid-space-6); padding: 4rem;"
    >
      ${["top", "right", "bottom", "left"].map(
        (p) => html`
          <fluid-tooltip content=${`Placement: ${p}`} placement=${p as never}>
            <fluid-button variant="secondary">${p}</fluid-button>
          </fluid-tooltip>
        `
      )}
    </div>
  `
};

export const RichContent: Story = {
  render: () => html`
    <div style="padding: 4rem; display:flex; justify-content:center;">
      <fluid-tooltip placement="bottom">
        <div slot="content">
          <strong>Pro tip</strong><br />
          You can use rich content here.
        </div>
        <fluid-button>Rich tooltip</fluid-button>
      </fluid-tooltip>
    </div>
  `
};
