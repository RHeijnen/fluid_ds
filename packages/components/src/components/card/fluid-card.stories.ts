import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../badge/define.js";
import type { FluidCard } from "./fluid-card.js";

type Args = Pick<FluidCard, "variant">;

const meta: Meta<Args> = {
  title: "Components/Layout/Card",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["elevated", "outlined", "filled"] }
  },
  args: { variant: "elevated" },
  render: (args) => html`
    <div style="max-width: 360px;">
      <fluid-card variant=${args.variant}>
        <div
          slot="header"
          style="display:flex; align-items:center; justify-content:space-between;"
        >
          <span>Project status</span>
          <fluid-badge variant="success">Healthy</fluid-badge>
        </div>
        <p style="margin:0;">
          All systems operational. Latest deploy was 2 hours ago and passed all health checks.
        </p>
        <div slot="footer" style="display:flex; gap: var(--fluid-space-2); justify-content:flex-end;">
          <fluid-button variant="ghost">Details</fluid-button>
          <fluid-button>Deploy again</fluid-button>
        </div>
      </fluid-card>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: var(--fluid-space-4);">
      ${(["elevated", "outlined", "filled"] as const).map(
        (v) => html`
          <fluid-card variant=${v}>
            <strong slot="header">${v}</strong>
            <p style="margin:0;">Card content here.</p>
          </fluid-card>
        `
      )}
    </div>
  `
};

export const BodyOnly: Story = {
  render: () => html`
    <fluid-card style="max-width: 320px;">
      Just body, no header or footer slot, those areas should collapse.
    </fluid-card>
  `
};
