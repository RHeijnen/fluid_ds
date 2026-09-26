import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

/** A fixed moment so every capture renders the same face. */
const MOMENT = "2026-04-28T04:09:00";

const meta: Meta = {
  title: "Rainbow/Clock",
  tags: ["autodocs"],
  parameters: { status: { type: "beta" } }
};

export default meta;
type Story = StoryObj;

/** 24-hour and 12-hour faces, with and without the date line. */
export const Faces: Story = {
  render: () => html`
    <div style="display: flex; gap: 2.5rem; flex-wrap: wrap; align-items: end">
      <fluid-rainbow-clock datetime=${MOMENT} hour-cycle="h23"></fluid-rainbow-clock>
      <fluid-rainbow-clock datetime="2026-04-28T16:45:00" hour-cycle="h12"></fluid-rainbow-clock>
      <fluid-rainbow-clock datetime=${MOMENT} hour-cycle="h23" hide-date></fluid-rainbow-clock>
    </div>
  `
};
