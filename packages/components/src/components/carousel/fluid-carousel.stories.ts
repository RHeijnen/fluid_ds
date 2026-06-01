import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Layout/Carousel",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const slide = (label: string, color: string) => html`
  <fluid-carousel-item>
    <div
      style="
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--fluid-font-size-xl);
        color: white;
        background: ${color};
      "
    >
      ${label}
    </div>
  </fluid-carousel-item>
`;

export const Default: Story = {
  render: () => html`
    <fluid-carousel style="max-width: 32rem;">
      ${slide("Slide 1", "#4f46e5")} ${slide("Slide 2", "#0891b2")} ${slide("Slide 3", "#db2777")}
      ${slide("Slide 4", "#16a34a")}
    </fluid-carousel>
  `
};

export const Autoplay: Story = {
  render: () => html`
    <fluid-carousel autoplay="2500" loop style="max-width: 28rem;">
      ${slide("Auto 1", "#4f46e5")} ${slide("Auto 2", "#0891b2")} ${slide("Auto 3", "#db2777")}
    </fluid-carousel>
  `
};

export const NoControls: Story = {
  render: () => html`
    <fluid-carousel no-navigation no-pagination style="max-width: 28rem;">
      ${slide("A", "#4f46e5")} ${slide("B", "#0891b2")} ${slide("C", "#db2777")}
    </fluid-carousel>
  `
};
