import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidSkeleton } from "./fluid-skeleton.js";

type Args = Pick<FluidSkeleton, "effect">;

const meta: Meta<Args> = {
  title: "Components/Feedback/Skeleton",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    effect: { control: "inline-radio", options: ["pulse", "sheen", "none"] }
  },
  args: { effect: "pulse" }
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  render: (args) => html`
    <fluid-skeleton effect=${args.effect} style="height: 1.25rem; max-width: 280px;">
    </fluid-skeleton>
  `
};

export const ProfileCard: Story = {
  render: (args) => html`
    <div style="display:flex; gap: var(--fluid-space-4); align-items: center; max-width: 360px;">
      <fluid-skeleton
        effect=${args.effect}
        style="width: 3.5rem; height: 3.5rem; border-radius: 9999px; flex-shrink: 0;"
      ></fluid-skeleton>
      <div style="flex: 1; display:flex; flex-direction:column; gap: var(--fluid-space-2);">
        <fluid-skeleton effect=${args.effect} style="height: 1rem; width: 60%;"></fluid-skeleton>
        <fluid-skeleton effect=${args.effect} style="height: 0.75rem;"></fluid-skeleton>
        <fluid-skeleton effect=${args.effect} style="height: 0.75rem; width: 80%;"></fluid-skeleton>
      </div>
    </div>
  `
};

export const Sheen: Story = {
  args: { effect: "sheen" }
};
