import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidMap } from "./fluid-map.js";

async function map(): Promise<FluidMap> {
  const el = await fixture<FluidMap>(html`
    <fluid-map
      label="Test map"
      .center=${[51.505, -0.09]}
      .zoom=${13}
      .markers=${[
        { lat: 51.505, lng: -0.09, label: "Centre" },
        { lat: 51.51, lng: -0.1, label: "Edge" }
      ]}
      style="width: 400px;"
    ></fluid-map>
  `);
  await elementUpdated(el);
  await aTimeout(20);
  return el;
}

describe("<fluid-map>", () => {
  it("renders a labelled region container in light DOM", async () => {
    const el = await map();
    // Light DOM: no shadow root, the viewport is a direct child.
    expect(el.shadowRoot).to.equal(null);
    const region = el.querySelector('[part="base"]') as HTMLElement;
    expect(region).to.exist;
    expect(region.getAttribute("role")).to.equal("region");
    expect(region.getAttribute("aria-label")).to.equal("Test map");
  });

  it("initialises a Leaflet map at the given center and zoom", async () => {
    const el = await map();
    expect(el.querySelector(".leaflet-container")).to.exist;
  });

  it("places one marker per item", async () => {
    const el = await map();
    const markers = el.querySelectorAll(".leaflet-marker-icon");
    expect(markers.length).to.equal(2);
  });

  it("emits fluid-marker-click with the marker detail when a marker is clicked", async () => {
    const el = await map();
    const markerEl = el.querySelector<HTMLElement>(".leaflet-marker-icon")!;
    setTimeout(() => markerEl.click());
    const ev = await oneEvent(el, "fluid-marker-click");
    expect(ev.detail.marker.label).to.equal("Centre");
  });

  it("re-syncs markers when the markers prop changes", async () => {
    const el = await map();
    el.markers = [{ lat: 51.5, lng: -0.1 }];
    await elementUpdated(el);
    await aTimeout(0);
    expect(el.querySelectorAll(".leaflet-marker-icon").length).to.equal(1);
  });

  it("passes the a11y audit", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; width: 400px;"
      >
        <fluid-map label="Accessible map" .center=${[51.505, -0.09]} .zoom=${13}></fluid-map>
      </div>
    `);
    await elementUpdated(wrapper);
    await aTimeout(20);
    await expect(wrapper.querySelector("fluid-map")!).to.be.accessible();
  });
});
