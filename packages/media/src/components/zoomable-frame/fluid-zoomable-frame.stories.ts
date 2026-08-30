import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const SAMPLE_ONE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x2='1' y2='1'%3E%3Cstop stop-color='%230f766e'/%3E%3Cstop offset='1' stop-color='%2399f6e4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3Ccircle cx='610' cy='130' r='72' fill='%23fef3c7'/%3E%3Cpath d='M0 420 190 210l145 160 105-105 230 235H0z' fill='%231f2937' fill-opacity='.72'/%3E%3C/svg%3E";
const SAMPLE_TWO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x2='0' y2='1'%3E%3Cstop stop-color='%23312e81'/%3E%3Cstop offset='1' stop-color='%23c4b5fd'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3Ccircle cx='190' cy='145' r='78' fill='%23fde68a'/%3E%3Cpath d='M0 445 245 255l110 90 150-165 295 265v55H0z' fill='%23111827' fill-opacity='.78'/%3E%3C/svg%3E";

const meta: Meta = {
  title: "Media/ZoomableFrame",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
  render: () => html`
    <fluid-zoomable-frame style="width: 32rem; height: 20rem;">
      <img src=${SAMPLE_ONE} alt="Zoomable sample illustration" />
    </fluid-zoomable-frame>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const NoControls: Story = {
  render: () => html`
    <fluid-zoomable-frame no-controls style="width: 32rem; height: 20rem;">
      <img src=${SAMPLE_TWO} alt="Zoomable sample illustration" />
    </fluid-zoomable-frame>
  `
};
