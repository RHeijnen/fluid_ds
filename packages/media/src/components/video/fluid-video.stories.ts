import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const SRC = "https://www.w3schools.com/html/mov_bbb.mp4";

const meta: Meta = {
  title: "Media/Video",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`<fluid-video src=${SRC} style="max-width: 32rem;"></fluid-video>`
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Looping: Story = {
  render: () =>
    html`<fluid-video src=${SRC} loop muted style="max-width: 32rem;"></fluid-video>`
};
