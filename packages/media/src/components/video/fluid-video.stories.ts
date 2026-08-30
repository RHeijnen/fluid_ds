import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const SRC = "https://www.w3schools.com/html/mov_bbb.mp4";
const POSTER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23111827'/%3E%3Ccircle cx='320' cy='180' r='54' fill='%23fff' fill-opacity='.16'/%3E%3Cpath d='M306 148v64l52-32z' fill='%23fff'/%3E%3C/svg%3E";

const meta: Meta = {
  title: "Media/Video",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
  render: () =>
    html`<fluid-video
      src=${SRC}
      poster=${POSTER}
      preload="none"
      style="max-width: 32rem;"
    ></fluid-video>`
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Looping: Story = {
  render: () =>
    html`<fluid-video
      src=${SRC}
      poster=${POSTER}
      preload="none"
      loop
      muted
      style="max-width: 32rem;"
    ></fluid-video>`
};
