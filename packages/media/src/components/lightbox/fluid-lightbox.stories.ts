import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const img = (n: number) =>
  html`<img src="https://picsum.photos/seed/fluid${n}/200/200" alt="Sample photo ${n}" />`;

const meta: Meta = {
  title: "Media/Lightbox",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`
    <fluid-lightbox loop style="max-width: 32rem;">
      ${[1, 2, 3, 4, 5, 6].map((n) => img(n))}
    </fluid-lightbox>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Single: Story = {
  render: () => html`<fluid-lightbox style="max-width: 14rem;">${img(7)}</fluid-lightbox>`
};
