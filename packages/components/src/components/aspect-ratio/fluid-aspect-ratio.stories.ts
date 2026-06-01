import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidAspectRatio } from "./fluid-aspect-ratio.js";

type Args = Pick<FluidAspectRatio, "ratio">;

const placeholder = (label: string) => html`
  <div
    style="
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--fluid-surface-muted);
      color: var(--fluid-text-secondary);
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-sm);
    "
  >
    ${label}
  </div>
`;

const meta: Meta<Args> = {
  title: "Components/Layout/Aspect ratio",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    ratio: {
      control: "inline-radio",
      options: ["1/1", "4/3", "16/9", "21/9", "3/4"]
    }
  },
  args: { ratio: "16/9" },
  render: (args) => html`
    <div style="max-width: 320px;">
      <fluid-aspect-ratio ratio=${args.ratio}>
        ${placeholder(args.ratio)}
      </fluid-aspect-ratio>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Ratios: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fluid-space-3); max-width: 640px;"
    >
      <fluid-aspect-ratio ratio="1/1">${placeholder("1/1")}</fluid-aspect-ratio>
      <fluid-aspect-ratio ratio="4/3">${placeholder("4/3")}</fluid-aspect-ratio>
      <fluid-aspect-ratio ratio="16/9">${placeholder("16/9")}</fluid-aspect-ratio>
      <fluid-aspect-ratio ratio="3/4">${placeholder("3/4")}</fluid-aspect-ratio>
      <fluid-aspect-ratio ratio="21/9">${placeholder("21/9")}</fluid-aspect-ratio>
      <fluid-aspect-ratio ratio="1">${placeholder("1")}</fluid-aspect-ratio>
    </div>
  `
};

export const CoveredImage: Story = {
  render: () => html`
    <div style="max-width: 320px;">
      <fluid-aspect-ratio ratio="16/9">
        <img
          src="https://picsum.photos/seed/fluid/800/300"
          alt="Landscape sample, covered to fill a 16:9 box"
        />
      </fluid-aspect-ratio>
    </div>
  `
};

export const CustomRadius: Story = {
  render: () => html`
    <div style="max-width: 320px;">
      <fluid-aspect-ratio
        ratio="1/1"
        style="--fluid-aspect-ratio-radius: var(--fluid-radius-full);"
      >
        ${placeholder("rounded")}
      </fluid-aspect-ratio>
    </div>
  `
};
