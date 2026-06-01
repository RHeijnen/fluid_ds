import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const markers = [
  { lat: 51.505, lng: -0.09, label: "Centre" },
  { lat: 51.51, lng: -0.1, label: "North west" },
  { lat: 51.5, lng: -0.08, label: "South east" }
];

const meta: Meta = {
  title: "Map/Map",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: () => html`
    <fluid-map
      label="Map of central London"
      .center=${[51.505, -0.09]}
      .zoom=${13}
      .markers=${markers}
      style="max-width: 40rem;"
    ></fluid-map>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const NoMarkers: Story = {
  render: () => html`
    <fluid-map label="Empty map" .center=${[40.7128, -74.006]} .zoom=${11} style="max-width: 40rem;"></fluid-map>
  `
};

export const ZoomedOut: Story = {
  render: () => html`
    <fluid-map
      label="Map of Europe"
      .center=${[50.0, 10.0]}
      .zoom=${4}
      .markers=${[{ lat: 48.8566, lng: 2.3522, label: "Paris" }, { lat: 52.52, lng: 13.405, label: "Berlin" }]}
      style="max-width: 40rem;"
    ></fluid-map>
  `
};

export const Tall: Story = {
  render: () => html`
    <fluid-map
      label="Tall map"
      .center=${[51.505, -0.09]}
      .markers=${markers}
      style="max-width: 40rem; --fluid-map-height: 32rem;"
    ></fluid-map>
  `
};
