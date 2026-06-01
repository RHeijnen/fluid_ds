import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const SRC = "https://cdn.jsdelivr.net/gh/anars/blank-audio/250-milliseconds-of-silence.mp3";

const meta: Meta = {
  title: "Media/Audio",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`<fluid-audio src=${SRC} label="Sample track" style="max-width: 28rem;"></fluid-audio>`
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Looping: Story = {
  render: () => html`<fluid-audio src=${SRC} loop label="Looping track" style="max-width: 28rem;"></fluid-audio>`
};
