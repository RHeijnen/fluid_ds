import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

/** A fixed moment so every capture renders the same face. */
const MOMENT = "2026-04-28T04:09:00";

const meta: Meta = {
  title: "Rainbow/Landscape",
  tags: ["autodocs"],
  parameters: { status: { type: "beta" } }
};

export default meta;
type Story = StoryObj;

/** The signature tile: a landscape framing a clock. */
export const WithClock: Story = {
  render: () => html`
    <div style="max-inline-size: 28rem">
      <fluid-rainbow-landscape>
        <fluid-rainbow-clock datetime=${MOMENT} hour-cycle="h23"></fluid-rainbow-clock>
      </fluid-rainbow-landscape>
    </div>
  `
};

/** A frozen landscape with a meaningful name, exposed as an image. */
export const Labelled: Story = {
  render: () => html`
    <div style="max-inline-size: 20rem">
      <fluid-rainbow-landscape still label="Green hills under a blue sky"></fluid-rainbow-landscape>
    </div>
  `
};
