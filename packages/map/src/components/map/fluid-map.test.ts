import {
  expect,
  fixture,
  html,
  elementUpdated,
  oneEvent,
  waitUntil,
  aTimeout
} from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import type { FluidMap } from "./fluid-map.js";

const stylesheet = document.createElement("link");
stylesheet.rel = "stylesheet";
stylesheet.href = new URL("../../../node_modules/leaflet/dist/leaflet.css", import.meta.url).href;
stylesheet.setAttribute("data-fluid-map-leaflet-css", "");
document.head.append(stylesheet);

async function map(): Promise<FluidMap> {
  const el = await fixture<FluidMap>(html`
    <fluid-map
      tile-url=""
      label="Test map"
      .center=${[51.505, -0.09]}
      .zoom=${13}
      .markers=${[
        { lat: 51.505, lng: -0.09, label: "Centre", tone: "info" },
        { lat: 51.51, lng: -0.1, label: "Edge", tone: "info" }
      ]}
      style="width: 400px;"
    ></fluid-map>
  `);
  await elementUpdated(el);
  await waitUntil(() => el.querySelector(".leaflet-container"), "Leaflet did not initialize");
  await waitUntil(
    () => el.querySelectorAll(".leaflet-marker-icon").length === el.markers.length,
    "Leaflet markers did not settle"
  );
  return el;
}

describe("<fluid-map>", () => {
  // Give the initial dynamic ESM fetch its own bounded setup window. Individual
  // initialization assertions remain short and do not depend on CDN latency.
  before(async function () {
    this.timeout(30_000);
    await import("leaflet/dist/leaflet-src.esm.js");
  });

  it("gives toned markers a usable name and treats marker labels as plain text", async () => {
    const el = await map();
    el.markers = [{ lat: 51.505, lng: -0.09, label: "<strong>Depot</strong>", tone: "info" }];
    await elementUpdated(el);
    const marker = el.querySelector<HTMLElement>(".leaflet-marker-icon")!;
    expect(marker.getAttribute("aria-label")).to.equal("<strong>Depot</strong>");
    marker.click();
    const popup = el.querySelector(".leaflet-popup-content")!;
    expect(popup.textContent).to.equal("<strong>Depot</strong>");
    expect(popup.querySelector("strong")).to.equal(null);
  });

  it("omits tile requests when the tile URL is empty", async () => {
    const el = await map();
    expect(el.querySelectorAll("img.leaflet-tile")).to.have.length(0);
    expect((el as unknown as { tileLayer: unknown }).tileLayer).to.equal(undefined);
  });

  it("reconnects markers without duplicating activation listeners", async () => {
    const el = await map();
    const parent = el.parentElement!;
    el.remove();
    parent.append(el);
    await waitUntil(() => el.querySelectorAll(".leaflet-marker-icon").length === 2);
    const events: Event[] = [];
    el.addEventListener("fluid-marker-click", (event) => events.push(event));
    el.querySelector<HTMLElement>(".leaflet-marker-icon")!.click();
    expect(events).to.have.length(1);
  });

  it("cancels an active zoom transition before rapid reconnect", async () => {
    const el = await map();
    const parent = el.parentElement!;
    el.zoom += 1;
    await elementUpdated(el);
    el.remove();
    parent.append(el);
    await waitUntil(() => el.querySelectorAll(".leaflet-marker-icon").length === 2);
    expect(el.querySelector('[part="base"]')).to.exist;
  });

  it("renders a labelled region container in light DOM", async () => {
    const el = await map();
    // Light DOM: no shadow root, the viewport is a direct child.
    expect(el.shadowRoot).to.equal(null);
    const region = el.querySelector('[part="base"]') as HTMLElement;
    expect(region).to.exist;
    expect(region.getAttribute("role")).to.equal("region");
    expect(region.getAttribute("aria-label")).to.equal("Test map");
  });

  it("updates inherited Arabic and regional French names without recreating Leaflet state", async () => {
    const center: [number, number] = [51.505, -0.09];
    const markers = [
      { lat: 51.505, lng: -0.09 },
      { lat: 51.51, lng: -0.1, label: "" },
      { lat: 51.515, lng: -0.11, label: "<Caller depot>" }
    ];
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar-EG">
        <fluid-map
          tile-url=""
          .center=${center}
          .markers=${markers}
          style="width:400px"
        ></fluid-map>
      </div>
    `);
    const el = wrapper.querySelector<FluidMap>("fluid-map")!;
    await waitUntil(() => el.querySelectorAll(".leaflet-marker-icon").length === 3);
    const instance = (el as unknown as { map: unknown }).map;
    const icons = [...el.querySelectorAll<HTMLImageElement>(".leaflet-marker-icon")];
    const events: Event[] = [];
    el.addEventListener("fluid-move", (event) => events.push(event));
    el.addEventListener("fluid-marker-click", (event) => events.push(event));
    const region = el.querySelector<HTMLElement>('[part="base"]')!;
    expect(region.getAttribute("aria-label")).to.equal("خريطة");
    expect(region.dir).to.equal("rtl");
    expect(icons.map((icon) => icon.getAttribute("aria-label"))).to.deep.equal([
      "خريطة",
      "",
      "<Caller depot>"
    ]);
    expect(icons.map((icon) => icon.alt)).to.deep.equal(["خريطة", "", "<Caller depot>"]);
    // Leaflet owns these dependency strings; the wrapper does not patch them.
    expect(el.querySelector<HTMLElement>(".leaflet-control-zoom-in")!.title).to.equal("Zoom in");
    expect(el.querySelector<HTMLElement>(".leaflet-control-zoom-out")!.title).to.equal("Zoom out");

    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await el.updateComplete;
    expect((el as unknown as { map: unknown }).map).to.equal(instance);
    expect(el.center).to.equal(center);
    expect(el.markers).to.equal(markers);
    expect([...el.querySelectorAll(".leaflet-marker-icon")]).to.deep.equal(icons);
    expect(region.getAttribute("aria-label")).to.equal("Carte");
    expect(region.dir).to.equal("ltr");
    expect(icons.map((icon) => icon.getAttribute("aria-label"))).to.deep.equal([
      "Carte",
      "",
      "<Caller depot>"
    ]);
    expect(events).to.deep.equal([]);
  });

  it("preserves an explicitly empty map name", async () => {
    const el = await fixture<FluidMap>(html`
      <fluid-map tile-url="" label="" style="width:400px"></fluid-map>
    `);
    await waitUntil(() => el.querySelector(".leaflet-container"));
    expect(el.label).to.equal("");
    expect(el.querySelector('[part="base"]')!.getAttribute("aria-label")).to.equal("");
  });

  it("keeps ArrowRight as a physical eastward pan in Arabic RTL", async () => {
    const el = await fixture<FluidMap>(html`
      <fluid-map tile-url="" lang="ar" .center=${[51.505, -0.09]} style="width:400px"></fluid-map>
    `);
    await waitUntil(() => el.querySelector(".leaflet-container"));
    const before = (el as unknown as { map: { getCenter(): { lng: number } } }).map.getCenter().lng;
    const viewport = el.querySelector<HTMLElement>(".leaflet-container")!;
    viewport.focus();
    setTimeout(() =>
      viewport.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          code: "ArrowRight",
          keyCode: 39,
          bubbles: true
        })
      )
    );
    const event = await oneEvent(el, "fluid-move");
    expect(event.detail.center[1]).to.be.greaterThan(before);
    expect(el.center).to.deep.equal([51.505, -0.09]);
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

  it("emits one activation for Enter as well as one for a pointer click", async () => {
    const el = await map();
    const events: CustomEvent[] = [];
    el.addEventListener("fluid-marker-click", (event) => events.push(event as CustomEvent));
    const marker = el.querySelector<HTMLElement>(".leaflet-marker-icon")!;
    marker.focus();
    marker.dispatchEvent(
      new KeyboardEvent("keypress", {
        key: "Enter",
        keyCode: 13,
        charCode: 13,
        bubbles: true,
        composed: true
      })
    );
    expect(el.querySelector(".leaflet-popup-content")!.textContent).to.equal("Centre");
    expect(events).to.have.length(1);
    expect(events[0]!.detail).to.deep.equal({ marker: el.markers[0] });
    marker.click();
    expect(events).to.have.length(2);
    expect(
      events.every((event) => event.target === el && event.bubbles && event.composed)
    ).to.equal(true);
  });

  it("re-syncs markers when the markers prop changes", async () => {
    const el = await map();
    el.markers = [{ lat: 51.5, lng: -0.1, tone: "info" }];
    await elementUpdated(el);
    await waitUntil(() => el.querySelectorAll(".leaflet-marker-icon").length === 1);
    expect(el.querySelectorAll(".leaflet-marker-icon").length).to.equal(1);
  });

  it("renders a custom HTML / emoji marker via divIcon", async () => {
    const el = await fixture<FluidMap>(html`
      <fluid-map
        tile-url=""
        label="Custom emoji map"
        .center=${[51.505, -0.09]}
        .zoom=${13}
        .markers=${[{ lat: 51.505, lng: -0.09, label: "Coffee", icon: { html: "☕" } }]}
        style="width: 400px;"
      ></fluid-map>
    `);
    await elementUpdated(el);
    await waitUntil(() => el.querySelector(".fluid-map-marker"));
    const marker = el.querySelector<HTMLElement>(".fluid-map-marker");
    expect(marker, "custom html marker element exists").to.exist;
    expect(marker!.tagName).to.equal("DIV");
    expect(marker!.textContent).to.contain("☕");
  });

  it("renders a custom image marker with the given src", async () => {
    const src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='12' fill='blue'/%3E%3C/svg%3E";
    const el = await fixture<FluidMap>(html`
      <fluid-map
        tile-url=""
        label="Custom image map"
        .center=${[51.505, -0.09]}
        .zoom=${13}
        .markers=${[
          {
            lat: 51.505,
            lng: -0.09,
            icon: { iconUrl: src, iconSize: [32, 32], iconAnchor: [16, 16] }
          }
        ]}
        style="width: 400px;"
      ></fluid-map>
    `);
    await elementUpdated(el);
    await waitUntil(() => el.querySelector(`img.leaflet-marker-icon[src="${src}"]`));
    const img = el.querySelector<HTMLImageElement>(`img.leaflet-marker-icon[src="${src}"]`);
    expect(img, "custom image marker uses the given URL verbatim").to.exist;
  });

  it("renders a semantic tone pin (coloured Fluid divIcon)", async () => {
    const el = await fixture<FluidMap>(html`
      <fluid-map
        tile-url=""
        label="Toned map"
        .center=${[51.505, -0.09]}
        .zoom=${13}
        .markers=${[{ lat: 51.505, lng: -0.09, label: "Danger", tone: "danger" }]}
        style="width: 400px;"
      ></fluid-map>
    `);
    await elementUpdated(el);
    await waitUntil(() => el.querySelector(".fluid-map-pin--danger"));
    const pin = el.querySelector(".fluid-map-pin--danger");
    expect(pin, "toned pin element exists").to.exist;
    expect(pin!.querySelector("svg"), "tone pin draws an SVG").to.exist;
  });

  it("lets a custom icon take precedence over tone", async () => {
    const el = await fixture<FluidMap>(html`
      <fluid-map
        tile-url=""
        label="Precedence map"
        .center=${[51.505, -0.09]}
        .zoom=${13}
        .markers=${[{ lat: 51.505, lng: -0.09, tone: "info", icon: { html: "🚀" } }]}
        style="width: 400px;"
      ></fluid-map>
    `);
    await elementUpdated(el);
    await waitUntil(() => el.querySelector(".fluid-map-marker"));
    expect(el.querySelector(".fluid-map-marker"), "custom icon wins").to.exist;
    expect(el.querySelector(".fluid-map-pin"), "tone pin not used").to.not.exist;
  });

  it("emits fluid-move with center and zoom when the view moves", async () => {
    const el = await map();
    // Driving the reactive center/zoom props calls Leaflet's setView, which
    // fires moveend and so should emit the documented fluid-move event.
    setTimeout(() => {
      el.center = [52, 0.5];
      el.zoom = 10;
    });
    const ev = await oneEvent(el, "fluid-move");
    expect(ev.detail.center[0]).to.be.closeTo(52, 0.001);
    expect(ev.detail.center[1]).to.be.closeTo(0.5, 0.001);
    expect(ev.detail.zoom).to.equal(10);
  });

  it("tears the Leaflet map down when removed from the DOM", async () => {
    const el = await map();
    const instance = (el as unknown as { map: { off(): unknown; remove(): unknown } }).map;
    expect(instance, "map exists while connected").to.exist;
    const viewport = el.querySelector<HTMLElement>('[part="base"]')!;
    const teardown: string[] = [];
    const off = instance.off.bind(instance);
    const remove = instance.remove.bind(instance);
    instance.off = () => {
      teardown.push("off");
      return off();
    };
    instance.remove = () => {
      teardown.push("remove");
      return remove();
    };
    el.remove();
    expect(
      teardown.slice(0, 2),
      "wrapper callbacks are severed before Leaflet DOM teardown"
    ).to.deep.equal(["off", "remove"]);
    expect(
      (viewport as unknown as { _leaflet_events?: unknown })._leaflet_events,
      "Leaflet event store removed from reusable viewport"
    ).to.equal(undefined);
    expect((el as unknown as { map: unknown }).map, "map nulled on disconnect").to.be.undefined;
  });

  it("mirrors the Leaflet stylesheet into a containing shadow root, once", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    try {
      const el = document.createElement("fluid-map") as FluidMap;
      el.setAttribute("tile-url", "");
      el.setAttribute("label", "Shadow map");
      el.style.width = "300px";
      root.append(el);
      await waitUntil(
        () => !!root.querySelector("link[data-fluid-map-leaflet-css]"),
        "Leaflet stylesheet was not mirrored into the shadow root"
      );
      const second = document.createElement("fluid-map") as FluidMap;
      second.setAttribute("tile-url", "");
      second.setAttribute("label", "Second shadow map");
      root.append(second);
      await waitUntil(() => !!second.querySelector(".leaflet-container"), "second map init");
      expect(root.querySelectorAll("link[data-fluid-map-leaflet-css]").length).to.equal(1);
    } finally {
      host.remove();
    }
  });

  it("re-measures on real viewport resizes and ignores zero-size boxes", async () => {
    const el = await map();
    // Collapse to zero: the observer callback must take the zero-size guard
    // and leave the map alone.
    el.style.width = "0px";
    await aTimeout(80);
    // A real resize re-measures; identical follow-up boxes take the
    // same-size guard.
    el.style.width = "480px";
    await aTimeout(80);
    el.style.width = "480px";
    await aTimeout(60);
    expect(el.querySelector(".leaflet-container")).to.exist;
  });

  it("passes the a11y audit", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; width: 400px;"
      >
        <fluid-map
          tile-url=""
          label="Accessible map"
          .center=${[51.505, -0.09]}
          .zoom=${13}
        ></fluid-map>
      </div>
    `);
    await elementUpdated(wrapper);
    await waitUntil(
      () => wrapper.querySelector(".leaflet-container"),
      "Leaflet did not initialize"
    );
    await expect(wrapper.querySelector("fluid-map")!).to.be.accessible();
  });
});
