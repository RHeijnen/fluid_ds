import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../card/define.js";
import type { FluidFold } from "./fluid-fold.js";

type Args = Pick<FluidFold, "open" | "disabled" | "label" | "openLabel">;

const meta: Meta<Args> = {
  title: "Components/Layout/Fold",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    open: { control: "boolean" },
    disabled: { control: "boolean" },
    label: { control: "text" },
    openLabel: { control: "text" }
  },
  args: {
    open: false,
    disabled: false,
    label: "Show more",
    openLabel: ""
  },
  render: (args) => html`
    <fluid-fold
      ?open=${args.open}
      ?disabled=${args.disabled}
      label=${args.label}
      open-label=${args.openLabel}
    >
      <p style="margin: var(--fluid-space-3) 0 0; color: var(--fluid-text-secondary);">
        The details a reader only sometimes needs: device attributes, raw
        identifiers, the long tail of a record.
      </p>
    </fluid-fold>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Folded: Story = {};

export const Unfolded: Story = {
  args: { open: true }
};

export const OwnOpenLabel: Story = {
  args: { label: "Show all device details", openLabel: "Hide device details" }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const BetweenSections: Story = {
  render: () => html`
    <div style="display: grid; gap: var(--fluid-space-4); max-width: 40rem;">
      <fluid-card>
        <p style="margin: 0;">The part of the page everyone needs.</p>
      </fluid-card>
      <fluid-fold label="Show more" open-label="Show less">
        <fluid-card style="margin-top: var(--fluid-space-4);">
          <p style="margin: 0;">The part that was folded away.</p>
        </fluid-card>
      </fluid-fold>
    </div>
  `
};
