import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidTruncate } from "./fluid-truncate.js";

type Args = Pick<FluidTruncate, "lines" | "expanded" | "moreLabel" | "lessLabel"> & {
  text: string;
};

const longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
sunt in culpa qui officia deserunt mollit anim id est laborum.`;

const meta: Meta<Args> = {
  title: "Components/Content/Truncate",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    lines: { control: { type: "number", min: 1, max: 10 } },
    expanded: { control: "boolean" },
    moreLabel: { control: "text" },
    lessLabel: { control: "text" }
  },
  args: {
    lines: 3,
    expanded: false,
    moreLabel: "Show more",
    lessLabel: "Show less",
    text: longText
  },
  render: (args) => html`
    <div style="max-width: 28rem;">
      <fluid-truncate
        lines=${args.lines}
        ?expanded=${args.expanded}
        more-label=${args.moreLabel}
        less-label=${args.lessLabel}
      >
        ${args.text}
      </fluid-truncate>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const OneLine: Story = {
  args: { lines: 1 }
};

export const FiveLines: Story = {
  args: { lines: 5 }
};

export const Expanded: Story = {
  args: { expanded: true }
};

export const NoOverflow: Story = {
  render: () => html`
    <div style="max-width: 28rem;">
      <fluid-truncate lines="3">Short text that never overflows.</fluid-truncate>
    </div>
  `
};

export const CustomLabels: Story = {
  args: { moreLabel: "Read full description", lessLabel: "Collapse" }
};
