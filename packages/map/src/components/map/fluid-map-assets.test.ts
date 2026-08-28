import { expect, fixture, html, elementUpdated, waitUntil, aTimeout } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/ar";
import { FluidMap } from "../../index.js";

const cdnBase = "https://unpkg.com/leaflet@1.9.4/dist/";
const cssUrl = `${cdnBase}leaflet.css`;
const localCss = new URL("../../../node_modules/leaflet/dist/leaflet.css", import.meta.url).href;
const imageUrls = new Map(
  ["marker-icon.png", "marker-icon-2x.png", "marker-shadow.png"].map((name) => [
    `${cdnBase}images/${name}`,
    new URL(`../../../node_modules/leaflet/dist/images/${name}`, import.meta.url).href
  ])
);
const cssRequests: string[] = [];
const imageRequests: string[] = [];

async function ready(el: FluidMap): Promise<void> {
  await elementUpdated(el);
  await waitUntil(() => el.querySelector(".leaflet-container"), "The real Leaflet map initializes");
}

async function decodedTiles(el: FluidMap, source: string): Promise<HTMLImageElement[]> {
  await waitUntil(() => {
    const tiles = [...el.querySelectorAll<HTMLImageElement>("img.leaflet-tile")];
    return (
      tiles.length > 0 &&
      tiles.every((tile) => tile.src === source && tile.complete && tile.naturalWidth === 256)
    );
  }, "The current tile layer decodes the supplied local image");
  return [...el.querySelectorAll<HTMLImageElement>("img.leaflet-tile")];
}

describe("<fluid-map> first-load assets and tile lifecycle", () => {
  const originalAppend = document.head.appendChild;
  const imageSource = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src")!;

  before(async function () {
    this.timeout(30_000);
    // This fresh WTR realm intentionally has no preinstalled Leaflet stylesheet.
    // Redirect only known CDN assets to the installed identical package files.
    // Assertions cover requested URLs and actual decoding, not CDN availability.
    document.head.appendChild = function <T extends Node>(node: T): T {
      if (node instanceof HTMLLinkElement && node.rel === "stylesheet") {
        const requested = node.href;
        if (requested === cssUrl) {
          cssRequests.push(requested);
          node.href = localCss;
        } else if (new URL(requested).origin !== location.origin) {
          throw new Error(`Unexpected external stylesheet: ${requested}`);
        }
      }
      return originalAppend.call(this, node) as T;
    };
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      ...imageSource,
      set(value: string) {
        const requested = new URL(value, document.baseURI).href;
        const local = imageUrls.get(requested);
        if (local) imageRequests.push(requested);
        else if (!requested.startsWith("data:") && new URL(requested).origin !== location.origin)
          throw new Error(`Unexpected external image: ${requested}`);
        imageSource.set!.call(this, local ?? value);
      }
    });
    await import("leaflet/dist/leaflet-src.esm.js");
  });

  after(() => {
    try {
      document.head.appendChild = originalAppend;
    } finally {
      Object.defineProperty(HTMLImageElement.prototype, "src", imageSource);
    }
  });

  it("auto-loads a working Leaflet stylesheet once for multiple public map instances", async () => {
    expect(document.querySelector("link[data-fluid-map-leaflet-css]")).to.equal(null);
    const wrapper = await fixture<HTMLElement>(html`
      <div>
        <fluid-map tile-url="" label="First map" style="width:400px"></fluid-map>
        <fluid-map tile-url="" label="Second map" style="width:400px"></fluid-map>
      </div>
    `);
    const maps = [...wrapper.querySelectorAll<FluidMap>("fluid-map")];
    await Promise.all(maps.map(ready));
    const links = document.querySelectorAll<HTMLLinkElement>("link[data-fluid-map-leaflet-css]");
    expect(cssRequests).to.deep.equal([cssUrl]);
    expect(links.length).to.equal(1);
    expect(links[0]!.href).to.equal(localCss);
    await waitUntil(() => links[0]!.sheet !== null, "The redirected real Leaflet CSS loads");
    expect(links[0]!.sheet!.cssRules.length).to.be.greaterThan(0);
    expect(document.querySelectorAll("style[data-fluid-map]").length).to.equal(1);
    for (const [index, el] of maps.entries()) {
      const region = el.querySelector<HTMLElement>('[part="base"]')!;
      expect(region.getAttribute("aria-label")).to.equal(index === 0 ? "First map" : "Second map");
      expect(region.getBoundingClientRect().height).to.be.greaterThan(0);
    }
  });

  it("decodes default PNG markers with correct anchors, names and activation payloads", async () => {
    const markers = [
      { lat: 51.505, lng: -0.09, label: "<strong>Default depot</strong>" },
      { lat: 51.51, lng: -0.1 }
    ];
    const el = await fixture<FluidMap>(html`
      <fluid-map tile-url="" label="Depot map" .markers=${markers} style="width:400px"></fluid-map>
    `);
    await ready(el);
    expect(el).to.be.instanceOf(FluidMap);
    await waitUntil(() => {
      const images = [
        ...el.querySelectorAll<HTMLImageElement>(
          "img.leaflet-marker-icon, img.leaflet-marker-shadow"
        )
      ];
      return (
        images.length === 4 && images.every((image) => image.complete && image.naturalWidth > 0)
      );
    }, "Both default icons and shadows decode from real local Leaflet PNG files");
    const icons = [...el.querySelectorAll<HTMLImageElement>("img.leaflet-marker-icon")];
    const shadows = [...el.querySelectorAll<HTMLImageElement>("img.leaflet-marker-shadow")];
    expect(imageRequests.filter((url) => url.endsWith("marker-shadow.png"))).to.have.length(2);
    expect(imageRequests.filter((url) => /marker-icon(?:-2x)?\.png$/.test(url))).to.have.length(2);
    expect(imageRequests.every((url) => imageUrls.has(url))).to.equal(true);
    for (const icon of icons) {
      expect([...imageUrls.values()]).to.include(icon.src);
      expect([25, 50]).to.include(icon.naturalWidth);
      expect(icon.style.width).to.equal("25px");
      expect(icon.style.height).to.equal("41px");
      expect(icon.style.marginLeft).to.equal("-12px");
      expect(icon.style.marginTop).to.equal("-41px");
    }
    expect(shadows.every((shadow) => shadow.naturalWidth === 41)).to.equal(true);
    expect(icons[0]!.getAttribute("aria-label")).to.equal(markers[0]!.label);
    expect(icons[1]!.alt).to.equal("Depot map");
    expect(icons[1]!.getAttribute("aria-label")).to.equal("Depot map");
    const activations: CustomEvent[] = [];
    el.addEventListener("fluid-marker-click", (event) => activations.push(event as CustomEvent));
    icons[0]!.click();
    expect(activations.length).to.equal(1);
    expect(activations[0]!.detail).to.deep.equal({ marker: markers[0] });
    expect(activations[0]!.bubbles && activations[0]!.composed).to.equal(true);
    const popup = el.querySelector(".leaflet-popup-content")!;
    expect(popup.textContent).to.equal(markers[0]!.label);
    expect(popup.querySelector("strong")).to.equal(null);
  });

  it("replaces tile and attribution layers without replacing the map or its markers", async () => {
    const tile = (fill: string) =>
      `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${fill}"/></svg>`
      )}`;
    const red = tile("red");
    const blue = tile("blue");
    const el = await fixture<FluidMap>(html`
      <fluid-map
        .tileUrl=${red}
        attribution='<a href="/source-a">Source A</a>'
        label="Local tiles"
        .markers=${[{ lat: 51.505, lng: -0.09, label: "Depot", tone: "info" }]}
        style="width:400px"
      ></fluid-map>
    `);
    await ready(el);
    const viewport = el.querySelector(".leaflet-container")!;
    const marker = el.querySelector(".leaflet-marker-icon")!;
    const originalTiles = await decodedTiles(el, red);
    expect(
      el.querySelector('.leaflet-control-attribution a[href="/source-a"]')!.textContent
    ).to.equal("Source A");

    el.tileUrl = blue;
    el.attribution = '<a href="/source-b">Source B</a>';
    await elementUpdated(el);
    const replacedTiles = await decodedTiles(el, blue);
    expect(originalTiles.every((image) => !image.isConnected)).to.equal(true);
    expect(replacedTiles.some((image) => originalTiles.includes(image))).to.equal(false);
    expect(el.querySelector('.leaflet-control-attribution a[href="/source-a"]')).to.equal(null);
    expect(
      el.querySelector('.leaflet-control-attribution a[href="/source-b"]')!.textContent
    ).to.equal("Source B");

    el.attribution = "Updated source";
    await elementUpdated(el);
    await decodedTiles(el, blue);
    expect(el.querySelector(".leaflet-control-attribution")!.textContent).to.contain(
      "Updated source"
    );
    expect(el.querySelector('.leaflet-control-attribution a[href="/source-b"]')).to.equal(null);

    el.tileUrl = "";
    await elementUpdated(el);
    expect(el.querySelectorAll("img.leaflet-tile").length).to.equal(0);
    expect(el.querySelector(".leaflet-control-attribution")!.textContent).not.to.contain(
      "Updated source"
    );

    el.tileUrl = red;
    await elementUpdated(el);
    await decodedTiles(el, red);
    expect(el.querySelector(".leaflet-container") === viewport).to.equal(true);
    expect(el.querySelector(".leaflet-marker-icon") === marker).to.equal(true);
    expect(el.querySelector(".leaflet-control-attribution")!.textContent).to.contain(
      "Updated source"
    );
    expect(cssRequests).to.deep.equal([cssUrl]);
  });

  it("does not refetch tiles or replace attribution and markers for a locale-only change", async () => {
    const source = `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="green"/></svg>'
    )}`;
    const el = await fixture<FluidMap>(html`
      <fluid-map
        .tileUrl=${source}
        attribution="<span>Caller source</span>"
        .markers=${[{ lat: 51.505, lng: -0.09 }]}
        style="width:400px"
      ></fluid-map>
    `);
    await ready(el);
    const tiles = await decodedTiles(el, source);
    await waitUntil(() => el.querySelector(".leaflet-marker-icon"));
    const instance = (el as unknown as { map: unknown }).map;
    const marker = el.querySelector(".leaflet-marker-icon")!;
    const events: Event[] = [];
    el.addEventListener("fluid-move", (event) => events.push(event));

    el.lang = "ar";
    await aTimeout(0);
    await el.updateComplete;
    expect((el as unknown as { map: unknown }).map).to.equal(instance);
    expect([...el.querySelectorAll("img.leaflet-tile")]).to.deep.equal(tiles);
    expect(el.querySelector(".leaflet-marker-icon")).to.equal(marker);
    expect(marker.getAttribute("aria-label")).to.equal("خريطة");
    expect(el.querySelector('[part="base"]')!.getAttribute("aria-label")).to.equal("خريطة");
    expect(el.querySelector(".leaflet-control-attribution")!.textContent).to.contain(
      "Caller source"
    );
    expect(events).to.deep.equal([]);
  });
});
