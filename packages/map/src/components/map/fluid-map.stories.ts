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

/** Semantic tone pins: coloured Fluid pins that follow the active theme/brand. */
export const TonedMarkers: Story = {
  render: () => html`
    <fluid-map
      label="Map with toned markers"
      .center=${[51.505, -0.09]}
      .zoom=${13}
      .markers=${[
        { lat: 51.505, lng: -0.09, label: "Info", tone: "info" },
        { lat: 51.515, lng: -0.1, label: "All good", tone: "success" },
        { lat: 51.5, lng: -0.075, label: "Heads up", tone: "warning" },
        { lat: 51.49, lng: -0.11, label: "Problem", tone: "danger" }
      ]}
      style="max-width: 40rem;"
    ></fluid-map>
  `
};

/**
 * Fully custom markers: an emoji (HTML `divIcon`) and an inline-SVG image icon.
 * Each marker can mix freely with the default pin and toned pins.
 */
export const CustomMarkers: Story = {
  render: () => {
    const pinSvg =
      "data:image/svg+xml," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#7c3aed" stroke="#fff" stroke-width="1.5"><circle cx="12" cy="12" r="9"/></svg>'
      );
    return html`
      <fluid-map
        label="Map with custom markers"
        .center=${[51.505, -0.09]}
        .zoom=${13}
        .markers=${[
          { lat: 51.505, lng: -0.09, label: "Coffee", icon: { html: "☕" } },
          { lat: 51.515, lng: -0.1, label: "Star", icon: { html: "⭐", iconSize: [40, 40] } },
          {
            lat: 51.5,
            lng: -0.075,
            label: "Custom image",
            icon: { iconUrl: pinSvg, iconSize: [32, 32], iconAnchor: [16, 16] }
          }
        ]}
        style="max-width: 40rem;"
      ></fluid-map>
    `;
  }
};
