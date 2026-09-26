import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/components/define/icon";
import { rainbowIconNames, registerRainbowIcons } from "./icons.js";

registerRainbowIcons();

const meta: Meta = {
  title: "Rainbow/Icons",
  parameters: { status: { type: "beta" } }
};

export default meta;
type Story = StoryObj;

/** The illustrated icon set, registered from `@fluid-ds/rainbow/icons/register`. */
export const Gallery: Story = {
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: 1rem">
      ${rainbowIconNames.map(
        (name) => html`
          <figure
            style="display: grid; justify-items: center; gap: 0.35rem; margin: 0; font: 12px sans-serif"
          >
            <fluid-icon name=${name} style="--fluid-icon-size: 64px"></fluid-icon>
            <figcaption>${name}</figcaption>
          </figure>
        `
      )}
    </div>
  `
};
