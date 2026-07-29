import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const SRC =
  "https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif";

const meta: Meta = {
  title: "Media/Animated Image",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () =>
    html`<fluid-animated-image
      src=${SRC}
      alt="Rotating earth"
      style="max-width: 20rem;"
    ></fluid-animated-image>`
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Paused: Story = {
  render: () =>
    html`<fluid-animated-image
      src=${SRC}
      alt="Rotating earth"
      paused
      style="max-width: 20rem;"
    ></fluid-animated-image>`
};

export const NoControl: Story = {
  render: () =>
    html`<fluid-animated-image
      src=${SRC}
      alt="Rotating earth"
      no-control
      style="max-width: 20rem;"
    ></fluid-animated-image>`
};
