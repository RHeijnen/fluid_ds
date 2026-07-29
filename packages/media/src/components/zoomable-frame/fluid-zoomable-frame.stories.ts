import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Media/ZoomableFrame",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`
    <fluid-zoomable-frame style="width: 32rem; height: 20rem;">
      <img src="https://picsum.photos/seed/fluid-zoom/800/500" alt="Zoomable sample photo" />
    </fluid-zoomable-frame>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const NoControls: Story = {
  render: () => html`
    <fluid-zoomable-frame no-controls style="width: 32rem; height: 20rem;">
      <img src="https://picsum.photos/seed/fluid-zoom2/800/500" alt="Zoomable sample photo" />
    </fluid-zoomable-frame>
  `
};
