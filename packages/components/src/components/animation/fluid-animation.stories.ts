import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Utilities/Animation",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  }
};

export default meta;
type Story = StoryObj;

const box = html`
  <div
    style="width: 80px; height: 80px; border-radius: 8px; background: var(--fluid-accent-base); display: grid; place-items: center; color: var(--fluid-accent-text);"
  >
    ●
  </div>
`;

export const Preset: Story = {
  render: () => html`
    <fluid-animation name="slideInUp" duration="600" play>${box}</fluid-animation>
  `
};

export const CustomKeyframes: Story = {
  render: () => {
    const el = document.createElement("fluid-animation") as any;
    el.keyframes = [
      { transform: "rotate(0deg)" },
      { transform: "rotate(360deg)" }
    ];
    el.duration = 1200;
    el.iterations = Infinity;
    el.play = true;
    el.innerHTML = `<div style="width:80px;height:80px;border-radius:8px;background:var(--fluid-accent-base);"></div>`;
    return el;
  }
};
