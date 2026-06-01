import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidCountdown } from "./fluid-countdown.js";

type Args = Pick<FluidCountdown, "format" | "autostart" | "seconds"> & {
  target?: string;
};

/** An ISO string a fixed offset into the future, recomputed per render. */
const inFuture = (secs: number) => new Date(Date.now() + secs * 1000).toISOString();

const meta: Meta<Args> = {
  title: "Components/Content/Countdown",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    format: { control: "inline-radio", options: ["segments", "clock"] },
    autostart: { control: "boolean" },
    seconds: { control: "number" }
  },
  args: { format: "segments", autostart: true, seconds: 90 },
  render: (args) => html`
    <fluid-countdown
      format=${args.format}
      ?autostart=${args.autostart}
      seconds=${args.seconds}
    ></fluid-countdown>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Clock: Story = {
  args: { format: "clock", seconds: 3661 }
};

export const Segments: Story = {
  args: { format: "segments", seconds: 90061 }
};

export const ToTarget: Story = {
  render: () => html`
    <fluid-countdown format="segments" target=${inFuture(3600 * 26)}></fluid-countdown>
  `
};

export const Paused: Story = {
  args: { autostart: false, seconds: 120 }
};

export const Complete: Story = {
  args: { seconds: 0 }
};
